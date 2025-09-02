"""Canonical config loader (TOML) for Notāre backend."""
from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Any, Dict

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.toml"
SAMPLE_PATH = Path(__file__).resolve().parent.parent / "config.sample.toml"


def load_config() -> Dict[str, Any]:
    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("rb") as f:
            return tomllib.load(f)
    if SAMPLE_PATH.exists():
        raise FileNotFoundError(
            f"Configuration file 'config.toml' not found. Copy '{SAMPLE_PATH.name}' to 'config.toml' and edit your settings."
        )
    raise FileNotFoundError("No configuration file found. Please create 'config.toml'.")
