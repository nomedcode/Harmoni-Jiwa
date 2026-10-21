#!/usr/bin/env python3
"""Seed demo accounts into a local Supabase Auth instance.

Usage:
    python3 scripts/supabase_demo_users.py [SUPABASE_URL] [SERVICE_KEY]

Defaults:
    SUPABASE_URL -> http://127.0.0.1:54321
    SERVICE_KEY  -> $SUPABASE_SERVICE_KEY (copy it from `supabase status`)

Accounts created (idempotent: existing users are synced instead):
    karyawan@harmoni.test / Password123!  (role: karyawan)
    pasien@harmoni.test   / Password123!  (role: patient)

The Supabase ids of these accounts are recorded in
backend/database/seeders/demo-user-ids.json so ClinicDemoSeeder can bind
demo data to them on any machine (the file is machine-specific and
gitignored; the seeder falls back to the original ids when it is absent).
"""

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_URL = "http://127.0.0.1:54321"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDS_PATH = os.path.join(
    REPO_ROOT, "backend", "database", "seeders", "demo-user-ids.json"
)

DEMO_USERS = [
    {
        "email": "karyawan@harmoni.test",
        "password": "Password123!",
        "full_name": "Admin Karyawan",
        "role": "karyawan",
    },
    {
        "email": "pasien@harmoni.test",
        "password": "Password123!",
        "full_name": "John Doe 1",
        "role": "patient",
    },
]


def request(base_url, path, method="GET", payload=None, service_key=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "apikey": service_key,
        "Authorization": "Bearer " + service_key,
        "Content-Type": "application/json",
    }
    req = urllib.request.Request(
        base_url.rstrip("/") + path, data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8")
        try:
            return err.code, json.loads(body)
        except json.JSONDecodeError:
            return err.code, {"raw": body}


def find_user_id(base_url, service_key, email):
    status, body = request(
        base_url, "/auth/v1/admin/users?per_page=100", service_key=service_key
    )
    if status != 200:
        return None
    for user in body.get("users", []):
        if user.get("email", "").lower() == email.lower():
            return user.get("id")
    return None


def upsert_user(base_url, service_key, user):
    payload = {
        "email": user["email"],
        "password": user["password"],
        "email_confirm": True,
        "user_metadata": {"full_name": user["full_name"]},
        "app_metadata": {"role": user["role"]},
    }
    status, body = request(
        base_url, "/auth/v1/admin/users", method="POST", payload=payload,
        service_key=service_key,
    )
    if status in (200, 201):
        user_id = body.get("id") or find_user_id(base_url, service_key, user["email"])
        if not user_id:
            print("missing : %s created but id lookup failed" % user["email"], file=sys.stderr)
            return None
        print("created : %s (%s)" % (user["email"], user["role"]))
        return user_id
    if status == 422 and "already" in json.dumps(body):
        user_id = find_user_id(base_url, service_key, user["email"])
        if not user_id:
            print("missing : %s exists but id lookup failed" % user["email"], file=sys.stderr)
            return False
        update = {
            "user_metadata": {"full_name": user["full_name"]},
            "app_metadata": {"role": user["role"]},
        }
        status, _ = request(
            base_url, "/auth/v1/admin/users/" + user_id, method="PUT",
            payload=update, service_key=service_key,
        )
        if status == 200:
            print("synced  : %s (%s)" % (user["email"], user["role"]))
            return user_id
        print("failed  : %s update returned HTTP %s" % (user["email"], status), file=sys.stderr)
        return None
    print("failed  : %s HTTP %s %s" % (user["email"], status, json.dumps(body)), file=sys.stderr)
    return None


def write_ids_file(ids):
    payload = json.dumps(ids, indent=2, sort_keys=True) + "\n"
    try:
        with open(IDS_PATH, "w", encoding="utf-8") as handle:
            handle.write(payload)
    except OSError as err:
        print("error   : could not write %s (%s)" % (IDS_PATH, err), file=sys.stderr)
        return
    print("wrote   : %s" % os.path.relpath(IDS_PATH, REPO_ROOT))


def main():
    base_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    service_key = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("SUPABASE_SERVICE_KEY")
    if not service_key:
        print("error   : pass the service key as argument 2 or $SUPABASE_SERVICE_KEY", file=sys.stderr)
        print("hint    : run `supabase status` inside supabase/ and copy the secret key", file=sys.stderr)
        return 1
    ids = {}
    ok = True
    for user in DEMO_USERS:
        user_id = upsert_user(base_url, service_key, user)
        if user_id:
            ids[user["role"]] = user_id
        else:
            ok = False
    if ids:
        write_ids_file(ids)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
