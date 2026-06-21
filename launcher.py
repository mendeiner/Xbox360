#!/usr/bin/env python3
"""Game Tracker Launcher — git commit & push, open site, trigger Vercel deploy."""
import tkinter as tk
from tkinter import scrolledtext, messagebox, simpledialog
import subprocess, threading, os, sys, webbrowser, json, hashlib, urllib.request

WORK_DIR    = os.path.dirname(os.path.abspath(__file__))
SITE_URL    = 'https://xbox360.vercel.app'
CONFIG_PATH = os.path.join(WORK_DIR, '.launcher_config.json')

BG     = '#0f0f0f'
CARD   = '#1a1a1a'
INPUT  = '#252525'
FG     = '#ffffff'
MUTED  = '#888888'
XBOX   = '#107C10'
GREEN  = '#a6e3a1'
RED    = '#f38ba8'
YELLOW = '#f9e2af'

FONT = ('Helvetica Neue', 13) if sys.platform == 'darwin' else ('Segoe UI', 11)
MONO = ('Menlo', 12)          if sys.platform == 'darwin' else ('Consolas', 11)


def load_config():
    try:
        with open(CONFIG_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def check_password(cfg):
    expected = cfg.get('password_hash')
    if not expected:
        return True  # no password configured, skip the gate
    root = tk.Tk()
    root.withdraw()
    for _ in range(3):
        pw = simpledialog.askstring('Game Tracker — Launcher', 'Senha:', show='*', parent=root)
        if pw is None:
            root.destroy()
            return False
        if hashlib.sha256(pw.encode()).hexdigest() == expected:
            root.destroy()
            return True
        messagebox.showerror('Senha incorreta', 'Tente novamente.', parent=root)
    root.destroy()
    return False


class Launcher(tk.Tk):
    def __init__(self, config):
        super().__init__()
        self.config_data = config
        self.title('Game Tracker — Launcher')
        self.configure(bg=BG, padx=16, pady=16)
        self.resizable(True, True)
        self._busy = False
        self._build_ui()
        self.geometry('640x560')

    # ── UI ────────────────────────────────────────────────────────────────

    def _build_ui(self):
        tk.Label(self, text='GAME TRACKER', font=(FONT[0], 20, 'bold'),
                 bg=BG, fg=XBOX).pack(pady=(0, 4))
        tk.Label(self, text='Commit e push para o GitHub → Vercel faz o deploy automaticamente',
                 font=(FONT[0], 11), bg=BG, fg=MUTED).pack(pady=(0, 16))

        self._build_git_section()
        self._build_actions_section()
        self._build_output_section()

    def _build_git_section(self):
        frame = self._card(' GitHub ')

        msg_row = tk.Frame(frame, bg=CARD)
        msg_row.pack(fill='x', pady=(0, 10))
        tk.Label(msg_row, text='Mensagem do commit:', font=FONT,
                 bg=CARD, fg=FG).pack(side='left')
        self.commit_msg = tk.Entry(msg_row, font=MONO, bg=INPUT, fg=FG,
                                    insertbackground=FG, relief='flat', bd=5)
        self.commit_msg.pack(side='left', fill='x', expand=True, padx=(10, 0))
        self.commit_msg.insert(0, 'update')

        btn_row = tk.Frame(frame, bg=CARD)
        btn_row.pack(fill='x')

        self.b_add    = self._btn(btn_row, 'git add .',   self._git_add,    MUTED)
        self.b_commit = self._btn(btn_row, 'git commit',  self._git_commit, MUTED)
        self.b_push   = self._btn(btn_row, 'git push',    self._git_push,   MUTED)
        self.b_all    = self._btn(btn_row, '▶  Add + Commit + Push', self._git_all, XBOX)

        self.b_add.pack(side='left', padx=(0, 6))
        self.b_commit.pack(side='left', padx=(0, 6))
        self.b_push.pack(side='left', padx=(0, 6))
        self.b_all.pack(side='right')

    def _build_actions_section(self):
        frame = self._card(' Ações ')
        btn_row = tk.Frame(frame, bg=CARD)
        btn_row.pack(fill='x')
        self.b_site   = self._btn(btn_row, '🌐  Abrir site', self._open_site, XBOX)
        self.b_status = self._btn(btn_row, 'git status',    self._git_status, MUTED)
        self.b_log    = self._btn(btn_row, 'git log',       self._git_log,    MUTED)
        self.b_site.pack(side='left', padx=(0, 6))
        self.b_status.pack(side='left', padx=(0, 6))
        self.b_log.pack(side='left')

        if self.config_data.get('deploy_hook_url'):
            self.b_deploy = self._btn(btn_row, '🚀  Deploy agora', self._deploy, XBOX)
            self.b_deploy.pack(side='right')

    def _build_output_section(self):
        lf = tk.LabelFrame(self, text=' Output ', font=FONT,
                            bg=BG, fg=XBOX, bd=0, padx=4, pady=4)
        lf.pack(fill='both', expand=True, pady=(10, 0))
        self.output = scrolledtext.ScrolledText(
            lf, font=MONO, bg='#111', fg=FG,
            relief='flat', bd=0, state='disabled', height=14)
        self.output.pack(fill='both', expand=True)
        self.output.tag_config('cmd',     foreground=XBOX,  font=(MONO[0], MONO[1], 'bold'))
        self.output.tag_config('success', foreground=GREEN)
        self.output.tag_config('error',   foreground=RED)
        tk.Button(lf, text='Limpar', font=FONT, bg=CARD, fg=MUTED,
                  relief='flat', cursor='hand2', command=self._clear
                  ).pack(pady=(4, 0))

    # ── Helpers ───────────────────────────────────────────────────────────

    def _card(self, title):
        lf = tk.LabelFrame(self, text=title, font=FONT,
                            bg=CARD, fg=XBOX, bd=0, padx=12, pady=10)
        lf.pack(fill='x', pady=(0, 10))
        return lf

    def _btn(self, parent, text, command, color):
        fg = BG if color in (XBOX,) else FG
        return tk.Button(parent, text=text, command=command,
                         font=FONT, bg=color, fg=fg,
                         relief='flat', padx=10, pady=6,
                         cursor='hand2', activebackground=color)

    def _clear(self):
        self.output.config(state='normal')
        self.output.delete('1.0', tk.END)
        self.output.config(state='disabled')

    def _all_buttons(self):
        btns = [self.b_add, self.b_commit, self.b_push, self.b_all,
                self.b_site, self.b_status, self.b_log]
        if hasattr(self, 'b_deploy'):
            btns.append(self.b_deploy)
        return btns

    def _set_buttons(self, enabled):
        state = 'normal' if enabled else 'disabled'
        for b in self._all_buttons():
            b.config(state=state)

    def _write(self, text, tag=None):
        def _do():
            self.output.config(state='normal')
            if tag:
                self.output.insert(tk.END, text, tag)
            else:
                self.output.insert(tk.END, text)
            self.output.see(tk.END)
            self.output.config(state='disabled')
        self.after(0, _do)

    def _exec(self, cmd):
        self._write(f'\n$ {cmd}\n', 'cmd')
        try:
            proc = subprocess.Popen(
                cmd, shell=True,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True, cwd=WORK_DIR)
            for line in proc.stdout:
                self._write(line)
            proc.wait()
            if proc.returncode == 0:
                self._write('✓ OK\n', 'success')
            else:
                self._write(f'✗ Erro (exit {proc.returncode})\n', 'error')
            return proc.returncode == 0
        except Exception as e:
            self._write(f'Erro: {e}\n', 'error')
            return False

    def _thread(self, fn):
        if self._busy:
            messagebox.showwarning('Aguarde', 'Um comando já está rodando.')
            return
        self._busy = True
        self._set_buttons(False)
        def wrapper():
            try:
                fn()
            finally:
                self._busy = False
                self.after(0, lambda: self._set_buttons(True))
        threading.Thread(target=wrapper, daemon=True).start()

    # ── Actions ───────────────────────────────────────────────────────────

    def _git_add(self):
        self._thread(lambda: self._exec('git add -A'))

    def _git_commit(self):
        msg = self.commit_msg.get().strip() or 'update'
        self._thread(lambda: self._exec(f'git commit -m "{msg}"'))

    def _git_push(self):
        self._thread(lambda: self._exec('git push'))

    def _git_all(self):
        msg = self.commit_msg.get().strip() or 'update'
        def do():
            self._exec('git add -A')
            self._exec(f'git commit -m "{msg}"')
            self._exec('git push')
            self._write(f'\n→ Vercel vai fazer o deploy automaticamente.\n   {SITE_URL}\n', 'success')
        self._thread(do)

    def _git_status(self):
        self._thread(lambda: self._exec('git status'))

    def _git_log(self):
        self._thread(lambda: self._exec('git log --oneline -10'))

    def _open_site(self):
        webbrowser.open(SITE_URL)
        self._write(f'\n→ Abrindo {SITE_URL}\n', 'success')

    def _deploy(self):
        url = self.config_data.get('deploy_hook_url')
        def do():
            self._write(f'\n$ POST {url}\n', 'cmd')
            try:
                with urllib.request.urlopen(urllib.request.Request(url, method='POST'), timeout=15) as resp:
                    self._write(f'✓ Deploy disparado (status {resp.status})\n', 'success')
                    self._write(f'   {SITE_URL}\n', 'success')
            except Exception as e:
                self._write(f'✗ Erro: {e}\n', 'error')
        self._thread(do)


if __name__ == '__main__':
    cfg = load_config()
    if not check_password(cfg):
        sys.exit(0)
    Launcher(cfg).mainloop()
