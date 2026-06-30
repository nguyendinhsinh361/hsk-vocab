#!/usr/bin/env python3
"""NestJS repo survey: map the project and flag common red flags in seconds.

Usage:
    python repo_survey.py <repo-root>

Prints: framework versions, ORM(s), module/controller/route map, global wiring
(pipes/filters/guards), and red flags (missing global ValidationPipe,
synchronize:true, string-built SQL, hardcoded secrets, unguarded mutating
routes, sync bcrypt, committed .env, console.log count).

Read-only; no dependencies beyond the standard library.
"""
import json
import re
import sys
from pathlib import Path

SKIP_DIRS = {"node_modules", "dist", "build", ".git", "coverage", ".next"}

HTTP_DECOS = ["Get", "Post", "Put", "Patch", "Delete", "Options", "Head", "All", "Sse"]
MUTATING = {"Post", "Put", "Patch", "Delete"}


def ts_files(root: Path):
    for p in root.rglob("*.ts"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.name.endswith(".d.ts"):
            continue
        yield p


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def main(root_str: str) -> None:
    root = Path(root_str).resolve()
    if not root.exists():
        sys.exit(f"Not found: {root}")

    # --- package.json ---
    print(f"# Survey: {root}\n")
    pkg = {}
    pkg_path = root / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(read(pkg_path))
        except json.JSONDecodeError:
            print("!! package.json unparseable")
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    interesting = [
        "@nestjs/core", "@nestjs/common", "typeorm", "@nestjs/typeorm", "prisma",
        "@prisma/client", "mongoose", "@nestjs/mongoose", "@nestjs/bullmq", "bullmq",
        "@nestjs/bull", "@nestjs/microservices", "kafkajs", "amqplib", "ioredis",
        "@nestjs/swagger", "@nestjs/throttler", "@nestjs/schedule", "@nestjs/cqrs",
        "@nestjs/graphql", "passport", "@nestjs/jwt", "bcrypt", "bcryptjs", "argon2",
        "class-validator", "nestjs-pino", "pino", "winston", "@nestjs/terminus",
        "jest", "vitest", "supertest",
    ]
    print("## Key dependencies")
    found_deps = {d: v for d, v in deps.items() if d in interesting}
    for d, v in sorted(found_deps.items()):
        print(f"  {d:30s} {v}")
    if not found_deps:
        print("  (none found — is this a NestJS repo?)")

    orms = [o for o, k in [("TypeORM", "typeorm"), ("Prisma", "@prisma/client"),
                           ("Mongoose", "mongoose")] if k in deps]
    print(f"\n  ORM(s): {', '.join(orms) or 'none detected'}")
    if "class-validator" not in deps:
        print("  !! class-validator not installed — DTO validation may be absent entirely")

    # --- scan files ---
    modules, controllers, entities, schemas = [], [], [], []
    routes = []  # (file, class, method_deco, path, guarded_at_class, guarded_at_method)
    flags = []
    console_log_count = 0
    global_pipe_found = False
    global_filter_found = False
    global_guard_found = False
    validation_pipe_found = False

    secret_re = re.compile(
        r"""\b(secret|password|api[_-]?key|token)\s*[:=]\s*['"][^'"]{4,}['"]""", re.I)
    sql_concat_re = re.compile(r"\.(query|\$queryRawUnsafe)\s*\(\s*[`'\"].*\$\{", re.S)
    order_by_interp_re = re.compile(r"ORDER\s+BY\s+[^'\"]*\$\{", re.I)

    for f in ts_files(root):
        text = read(f)
        rel = f.relative_to(root)

        if "@Module(" in text:
            modules.append(str(rel))
        if "@Injectable(" in text and f.name.endswith(".service.ts"):
            pass
        if "@Entity(" in text:
            entities.append(str(rel))
        if "@Schema(" in text:
            schemas.append(str(rel))

        console_log_count += len(re.findall(r"\bconsole\.log\(", text))

        # wiring
        if "useGlobalPipes" in text or "APP_PIPE" in text:
            global_pipe_found = True
            if "ValidationPipe" in text:
                validation_pipe_found = True
        if "useGlobalFilters" in text or "APP_FILTER" in text:
            global_filter_found = True
        if re.search(r"APP_GUARD", text):
            global_guard_found = True

        # red flags
        if re.search(r"synchronize\s*:\s*true", text):
            flags.append(f"synchronize:true in {rel} (destructive schema sync — prod bug)")
        if sql_concat_re.search(text) or order_by_interp_re.search(text):
            flags.append(f"string-built SQL / unsafe raw query in {rel} (SQL injection)")
        is_test = f.name.endswith((".spec.ts", ".e2e-spec.ts")) or "test/" in str(rel)
        for m in secret_re.finditer(text):
            if "process.env" not in m.group(0) and "configService" not in m.group(0) and not is_test:
                flags.append(f"possible hardcoded secret in {rel}: `{m.group(0)[:60]}…`")
        if re.search(r"\b(hashSync|compareSync|genSaltSync)\s*\(", text):
            flags.append(f"sync bcrypt call in {rel} (blocks event loop)")
        if re.search(r"\|\|\s*['\"]\w*secret\w*['\"]", text, re.I):
            flags.append(f"fallback default secret in {rel} (`|| 'secret'`)")

        # controllers & routes
        ctrl_m = re.search(r"@Controller\(\s*['\"]?([^'\")]*)", text)
        if ctrl_m:
            base = ctrl_m.group(1)
            controllers.append(str(rel))
            class_guarded = bool(re.search(r"@UseGuards\([^)]*\)\s*(?:@\w+\([^)]*\)\s*)*export\s+class", text)) \
                or "@UseGuards" in text.split("export class")[0]
            for dm in re.finditer(
                    r"@(" + "|".join(HTTP_DECOS) + r")\(\s*['\"]?([^'\")]*)['\"]?\s*\)"
                    r"((?:\s*@\w+\([^)]*\))*)\s*(?:async\s+)?(\w+)\s*\(", text):
                deco, path, between, method = dm.group(1), dm.group(2), dm.group(3), dm.group(4)
                seg_start = text.rfind("\n", 0, dm.start() - 300)
                window = text[max(0, dm.start() - 400):dm.start()]
                method_guarded = "@UseGuards" in window or "@UseGuards" in between
                routes.append((str(rel), base, deco, path, class_guarded, method_guarded, method))

    # --- env files ---
    env_files = [p for p in root.glob(".env*") if p.is_file() and p.name != ".env.example"]
    gitignore = read(root / ".gitignore")
    for e in env_files:
        if e.name not in gitignore:
            flags.append(f"{e.name} present and not in .gitignore (committed secrets?)")

    # --- report ---
    print(f"\n## Structure\n  modules: {len(modules)}  controllers: {len(controllers)}"
          f"  entities: {len(entities)}  mongoose schemas: {len(schemas)}")
    for m in modules[:40]:
        print(f"  module: {m}")

    print("\n## Routes")
    unguarded_mutating = []
    for rel, base, deco, path, cg, mg, method in routes:
        guard = "guarded" if (cg or mg or global_guard_found) else "OPEN"
        full = f"/{base}/{path}".replace("//", "/")
        print(f"  {deco.upper():7s} {full:40s} {method:25s} [{guard}]  {rel}")
        if deco in MUTATING and not (cg or mg or global_guard_found):
            unguarded_mutating.append(f"{deco.upper()} {full} ({rel})")

    print("\n## Global wiring")
    print(f"  ValidationPipe global: {'YES' if validation_pipe_found else 'NO  <-- flag'}")
    print(f"  Exception filter global: {'yes' if global_filter_found else 'no'}")
    print(f"  Global guard (APP_GUARD): {'yes' if global_guard_found else 'no'}")

    print("\n## Red flags")
    if not validation_pipe_found:
        flags.insert(0, "No global ValidationPipe detected — DTO decorators are dead code")
    if unguarded_mutating and not global_guard_found:
        flags.append("Unguarded mutating routes: " + "; ".join(unguarded_mutating[:10]))
    if console_log_count:
        flags.append(f"{console_log_count} console.log call(s) — use the structured logger")
    if not flags:
        print("  (none mechanically detected — judgment review still required)")
    for fl in flags:
        print(f"  !! {fl}")

    print("\nNote: heuristic static scan — verify findings in context; absence of a "
          "flag is not a security guarantee.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
