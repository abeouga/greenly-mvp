"""Local credentials only: never include their contents in logs or reports."""

import ctypes
import os
import subprocess
import time
from contextlib import contextmanager
from ctypes import wintypes
from pathlib import Path
from uuid import uuid4


@contextmanager
def instance_lock(root: Path):
    import msvcrt
    root.mkdir(parents=True, exist_ok=True)
    with (root / 'instance.lock').open('a+b') as stream:
        stream.seek(0, 2)
        if stream.tell() == 0:
            stream.write(b'0')
            stream.flush()
        deadline = time.monotonic() + 60
        while True:
            stream.seek(0)
            try:
                msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise ValueError('別のGreenly専用MySQL起動処理が実行中です。') from None
                time.sleep(.25)
        try:
            yield
        finally:
            stream.seek(0)
            msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)


def private_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.greenly-' + uuid4().hex)
    try:
        temporary.touch(mode=0o600, exist_ok=False)
        if os.name == 'nt':
            identity = subprocess.check_output(['whoami', '/user', '/fo', 'csv', '/nh'], text=True)
            sid = identity.strip().split(',')[-1].strip('"')
            result = subprocess.run(['icacls', str(temporary), '/inheritance:r', '/grant:r', f'*{sid}:(F)'],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            if result.returncode:
                raise ValueError('接続設定ファイルのアクセス制限に失敗しました。')
        temporary.write_text(content, encoding='utf-8')
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def save_settings(path: Path, values: dict[str, str]) -> None:
    lines = path.read_text(encoding='utf-8-sig').splitlines() if path.exists() else []
    keys = set(values)
    retained = [line for line in lines if line.strip().partition('=')[0].strip() not in keys]
    for key, value in values.items():
        if '\n' in value or '\r' in value:
            raise ValueError('接続設定に改行は使用できません。')
        retained.append(f'{key}={value}')
    private_file(path, '\n'.join(retained) + '\n')


class Blob(ctypes.Structure):
    _fields_ = [('size', wintypes.DWORD), ('data', ctypes.POINTER(ctypes.c_byte))]


def protect_secret(value: str, *, decrypt: bool = False) -> str:
    if os.name != 'nt':
        raise ValueError('Greenly専用MySQLはWindows専用です。')
    data = bytes.fromhex(value) if decrypt else value.encode('utf-8')
    buffer = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte)))
    target = Blob()
    if decrypt:
        ok = ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(source), None, None, None, None, 1,
                                                    ctypes.byref(target))
    else:
        ok = ctypes.windll.crypt32.CryptProtectData(ctypes.byref(source), 'Greenly MySQL', None, None, None, 1,
                                                  ctypes.byref(target))
    if not ok:
        raise ValueError('WindowsによるMySQL管理者認証情報の保護・復元に失敗しました。')
    try:
        result = ctypes.string_at(target.data, target.size)
        return result.decode('utf-8') if decrypt else result.hex()
    finally:
        ctypes.windll.kernel32.LocalFree(target.data)
