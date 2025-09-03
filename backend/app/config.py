"""Canonical config loader (TOML) for Notāre backend."""
from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Any, Dict

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config.toml"
SAMPLE_PATH = Path(__file__).resolve().parent.parent / "config.sample.toml"


def load_config() -> Dict[str, Any]:
    """Return config dict; empty if no file present.

    In stateless deployments the container ships without a config file. Instead
    settings are supplied per-request from the frontend. Therefore we should
    not raise when TOML is absent – simply return an empty dict so the caller
    can provide overrides.
    """
    if CONFIG_PATH.exists():
        with CONFIG_PATH.open("rb") as f:
            return tomllib.load(f)
    # If sample exists we are likely in local dev – still do not crash, just
    # inform the caller that defaults will be used.
    return {}
