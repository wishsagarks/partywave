#!/usr/bin/env python3
"""
gather_repo_snapshot.py

Scan a repo folder and create one or more text files containing the contents of
selected source/config files, with clear separators. This version splits the
output into multiple parts so you can paste parts individually.

Usage examples:
  python gather_repo_snapshot.py -o repo_snapshot.txt
  python gather_repo_snapshot.py --all --numbered -o atglance_snapshot.txt --part-size 200000
  python gather_repo_snapshot.py --include "app/**/*.ts" -o snap.txt --max-bytes -1

Notes:
 - If --stdout is set, the output will print to stdout (no splitting).
 - Default part size is 200000 bytes (~200 KB). Set --part-size -1 for no splitting (single file).
"""

from __future__ import annotations
import argparse
import fnmatch
import os
import sys
import stat
import base64
import pathlib
from typing import List, Iterable, Optional

# Defaults (extended for JS/TS heavy projects)
DEFAULT_PATTERNS = [
    "app/**/*.py",
    "app/**/*.ts",
    "app/**/*.tsx",
    "app/**/*.js",
    "app/**/*.jsx",
    "components/**/*.ts*",
    "components/**/*.js*",
    "hooks/**/*.ts*",
    "hooks/**/*.js*",
    "lib/**/*.ts*",
    "lib/**/*.js*",
    "services/**/*.ts*",
    "services/**/*.js*",
    "src/**/*.ts*",
    "src/**/*.js*",
    "scripts/**/*.py",
    "scripts/**/*.sh",
    "Dockerfile",
    "docker-compose*.yml",
    "package.json",
    "tsconfig.json",
    "package-lock.json",
    "README*",
    ".env",
    "supabase/**/*.sql",
    "migrations/**/*.sql",
    "*.md",
    "*.toml",
    "*.yml",
    "*.yaml",
    "app.json",
]

DEFAULT_EXCLUDE = [
    ".git/*",
    "node_modules/*",
    "dist/*",
    "build/*",
    "out/*",
    "venv/*",
    ".venv/*",
    "__pycache__/*",
    "*.pyc",
    "*.db",
    "*.sqlite",
    "*.jpg",
    "*.jpeg",
    "*.png",
    "*.gif",
    "*.zip",
    "*.tar",
]

EXTENSION_WHITELIST = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".mdx",
    ".html", ".css", ".scss", ".yml", ".yaml", ".toml", ".ini",
    ".env", ".sql", ".sh", ".ps1", ".cfg", ".lock", ".jsonc"
}

HEADER = ">>> FILE: {index}{path} (size: {size} bytes)\n--- BEGIN FILE ---\n"
FOOTER = "\n--- END FILE ---\n\n"
BINARY_HEADER = ">>> FILE: {index}{path} (size: {size} bytes) [BINARY]\n--- BEGIN BINARY (base64) ---\n"
BINARY_FOOTER = "\n--- END BINARY ---\n\n"

def normalize_rel(root_path: pathlib.Path, fullpath: pathlib.Path) -> str:
    return os.path.normpath(os.path.relpath(fullpath, root_path))

def iter_files_by_patterns(root: str, patterns: Iterable[str], exclude: Iterable[str], all_mode: bool=False):
    root_path = pathlib.Path(root).resolve()
    all_files = []
    patterns = list(patterns)
    exclude = list(exclude)
    for dirpath, dirnames, filenames in os.walk(root_path):
        rel_dir = os.path.relpath(dirpath, root_path)
        for fname in filenames:
            rel_path = os.path.normpath(os.path.join(rel_dir, fname)) if rel_dir != "." else fname
            if any(fnmatch.fnmatch(rel_path, pat) for pat in exclude):
                continue
            full = root_path / rel_path
            if all_mode:
                if full.suffix.lower() not in EXTENSION_WHITELIST and full.name not in {"Dockerfile", "Makefile", "Procfile"}:
                    continue
                all_files.append(str(full))
                continue
            if any(fnmatch.fnmatch(rel_path, pat) for pat in patterns):
                all_files.append(str(full))
    unique = sorted(dict.fromkeys(all_files))
    return unique

def is_binary_file(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            chunk = f.read(2048)
            if not chunk:
                return False
            if b"\0" in chunk:
                return True
            textchars = bytearray({7,8,9,10,12,13,27} | set(range(0x20, 0x100)))
            nontext = sum(1 for b in chunk if b not in textchars)
            return (nontext / max(1, len(chunk))) > 0.30
    except Exception:
        return True

def read_text_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        with open(path, "r", encoding="latin-1", errors="replace") as f:
            return f.read()
    except Exception as e:
        return f"<ERROR reading file: {e}>"

class PartWriter:
    """
    Manage writing to multiple part files. Creates files named:
      <outbase>_part_001.txt, <outbase>_part_002.txt, ...
    """
    def __init__(self, outbase: str, part_size: Optional[int], to_stdout: bool):
        self.outbase = outbase
        self.part_size = None if (part_size is None or part_size < 0) else int(part_size)
        self.to_stdout = to_stdout
        self.part_index = 0
        self.current_size = 0
        self.f = None

        if self.to_stdout and self.part_size is not None:
            # can't split when streaming to stdout
            print("[WARN] --stdout in use; part-size ignored (single stream)", file=sys.stderr)
            self.part_size = None

        if self.part_size is None:
            # single file mode -> create final path directly
            self._open_next_single()

    def _next_part_path(self):
        # increment index and produce filename
        self.part_index += 1
        # if outbase endswith .txt remove it for nicer naming
        base = self.outbase
        if base.lower().endswith(".txt"):
            base = base[:-4]
        return f"{base}_part_{str(self.part_index).zfill(3)}.txt"

    def _open_next_single(self):
        # open the "single" output (no splitting)
        self.part_index = 1
        path = self.outbase if not self.outbase.lower().endswith(".txt") else self.outbase
        self.f = open(path, "w", encoding="utf-8")
        self.current_size = 0
        print(f"[INFO] writing to {path}", file=sys.stderr)

    def _open_next(self):
        # close old
        if self.f:
            self.f.close()
        path = self._next_part_path()
        self.f = open(path, "w", encoding="utf-8")
        self.current_size = 0
        print(f"[INFO] opened part {path}", file=sys.stderr)
        return path

    def write(self, s: str):
        if self.to_stdout:
            sys.stdout.write(s)
            return
        # if part_size is None -> single file opened
        if self.part_size is None:
            self.f.write(s)
            self.current_size += len(s.encode("utf-8"))
            return
        # if no part opened yet, open first
        if self.f is None:
            self._open_next()
        # check if writing s would exceed part_size -> rotate first
        size_s = len(s.encode("utf-8"))
        if self.current_size + size_s > self.part_size and self.current_size > 0:
            # start new part
            self._open_next()
        self.f.write(s)
        self.current_size += size_s

    def close(self):
        if not self.to_stdout and self.f:
            self.f.close()

def gather_snapshot(
    root: str,
    patterns: List[str],
    exclude: List[str],
    outbase: str = "repo_snapshot.txt",
    to_stdout: bool = False,
    all_mode: bool = False,
    max_bytes: Optional[int] = 500_000,
    numbered: bool = False,
    embed_binary: bool = False,
    part_size: Optional[int] = 200_000,
):
    files = iter_files_by_patterns(root, patterns, exclude, all_mode=all_mode)
    if not files:
        msg = "No files matched the patterns.\nPatterns:\n  " + "\n  ".join(patterns)
        if to_stdout:
            print(msg)
        else:
            with open(outbase, "w", encoding="utf-8") as out:
                out.write(msg + "\n")
        return

    writer = PartWriter(outbase, part_size if not to_stdout else None, to_stdout)
    total = len(files)
    # header for first file (or for stdout)
    header_intro = f"# Repo snapshot generated by gather_repo_snapshot.py\n# Path: {os.path.abspath(root)}\n# Files collected: {len(files)}\n\n"
    writer.write(header_intro)

    for idx, path in enumerate(files, start=1):
        print(f"[{idx}/{total}] {path}", file=sys.stderr)
        try:
            st = os.stat(path)
            size = st.st_size if stat.S_ISREG(st.st_mode) else 0
        except Exception:
            size = 0
        rel = normalize_rel(pathlib.Path(root), pathlib.Path(path))
        index_prefix = f"{str(idx).zfill(4)}: " if numbered else ""
        # skip by max_bytes
        if max_bytes is not None and size > max_bytes:
            writer.write(HEADER.format(index=index_prefix, path=rel, size=size))
            writer.write(f"[SKIPPED: file size {size} bytes > max_bytes {max_bytes}]\n")
            writer.write(FOOTER)
            continue

        if is_binary_file(path):
            if embed_binary and (max_bytes is None or size <= (max_bytes or size)):
                try:
                    with open(path, "rb") as bf:
                        b64 = base64.b64encode(bf.read()).decode("ascii")
                    writer.write(BINARY_HEADER.format(index=index_prefix, path=rel, size=size))
                    for i in range(0, len(b64), 76):
                        writer.write(b64[i:i+76] + "\n")
                    writer.write(BINARY_FOOTER)
                except Exception as e:
                    writer.write(HEADER.format(index=index_prefix, path=rel, size=size))
                    writer.write(f"<ERROR embedding binary file: {e}>\n")
                    writer.write(FOOTER)
            else:
                writer.write(HEADER.format(index=index_prefix, path=rel, size=size))
                writer.write("<BINARY FILE - skipped>\n")
                writer.write(FOOTER)
            continue

        content = read_text_file(path)
        writer.write(HEADER.format(index=index_prefix, path=rel, size=size))
        writer.write(content)
        if not content.endswith("\n"):
            writer.write("\n")
        writer.write(FOOTER)

    writer.close()
    print(f"[DONE] Wrote snapshot into parts with base '{outbase}'.", file=sys.stderr)

def parse_args():
    ap = argparse.ArgumentParser(description="Gather repository files into split text snapshot parts.")
    ap.add_argument("--root", "-r", default=".", help="Repository root (default: current dir).")
    ap.add_argument("--include", "-i", action="append", help="Include glob pattern (can be specified multiple times).")
    ap.add_argument("--exclude", "-e", action="append", help="Exclude glob pattern (can be specified multiple times).")
    ap.add_argument("--stdout", action="store_true", help="Print to stdout instead of writing files (no splitting).")
    ap.add_argument("--out", "-o", default="repo_snapshot.txt", help="Output base path (default repo_snapshot.txt).")
    ap.add_argument("--all", action="store_true", help="Include all source/config files by extension whitelist.")
    ap.add_argument("--max-bytes", type=int, default=500_000, help="Max file size in bytes to include (default 500000). -1 for no limit.")
    ap.add_argument("--numbered", action="store_true", help="Prefix files with a zero-padded index.")
    ap.add_argument("--embed-binary", action="store_true", help="Embed small binary files as base64 instead of skipping.")
    ap.add_argument("--part-size", type=int, default=200_000,
                    help="Max bytes per snapshot part file (default 200000). Use -1 for no splitting (single file).")
    return ap.parse_args()

def main():
    args = parse_args()
    patterns = args.include if args.include else DEFAULT_PATTERNS
    exclude = args.exclude if args.exclude else DEFAULT_EXCLUDE
    max_bytes = None if args.max_bytes is None or args.max_bytes < 0 else args.max_bytes
    part_size = None if args.part_size is None or args.part_size < 0 else args.part_size

    gather_snapshot(
        root=args.root,
        patterns=patterns,
        exclude=exclude,
        outbase=args.out,
        to_stdout=args.stdout,
        all_mode=args.all,
        max_bytes=max_bytes,
        numbered=args.numbered,
        embed_binary=args.embed_binary,
        part_size=part_size,
    )

if __name__ == "__main__":
    main()
