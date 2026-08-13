"""
jane-power MT5 bridge
  • WebSocket ws://127.0.0.1:8765  -> live ticks
  • HTTP      http://127.0.0.1:8766/candles?symbol=XAUUSD&tf=1h  -> real OHLC history

Run with MetaTrader 5 OPEN and logged in:
    python bridge.py
"""
import asyncio
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import MetaTrader5 as mt5
import websockets

# app symbol  ->  broker's MT5 symbol name (MetaQuotes-Demo)
SYMBOL_MAP = {
    "XAUUSD": "XAUUSD",
    "XAGUSD": "XAGUSD",
    "EURUSD": "EURUSD",
    "GBPUSD": "GBPUSD",
    "USDJPY": "USDJPY",
    "AUDUSD": "AUDUSD",
    "USDCAD": "USDCAD",
    "SPX500": "US500",
    "US30": "US30",
    "NAS100": "USTEC",
}

TIMEFRAMES = {
    "1m": mt5.TIMEFRAME_M1,
    "5m": mt5.TIMEFRAME_M5,
    "15m": mt5.TIMEFRAME_M15,
    "1h": mt5.TIMEFRAME_H1,
    "4h": mt5.TIMEFRAME_H4,
    "1d": mt5.TIMEFRAME_D1,
}

HOST = "127.0.0.1"
WS_PORT = 8765
HTTP_PORT = 8766
POLL_SECONDS = 0.25

clients: set = set()
opens: dict = {}
mt5_lock = threading.Lock()  # MT5 calls are not thread-safe


def init_mt5() -> bool:
    if not mt5.initialize():
        print("MT5 initialize() failed:", mt5.last_error())
        print("Is the MetaTrader 5 terminal open and logged in?")
        return False
    acct = mt5.account_info()
    print(f"MT5 connected: {acct.login} @ {acct.server}")

    for app_sym, mt5_sym in SYMBOL_MAP.items():
        if not mt5.symbol_select(mt5_sym, True):
            print(f"  ! could not select {mt5_sym}")
            continue
        rates = mt5.copy_rates_from_pos(mt5_sym, mt5.TIMEFRAME_D1, 0, 1)
        if rates is not None and len(rates):
            opens[app_sym] = float(rates[0]["open"])
        print(f"  + {app_sym} -> {mt5_sym}")
    return True


# ── HTTP: historical candles ──────────────────────────────────
class CandleHandler(BaseHTTPRequestHandler):
    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path != "/candles":
            self._send(404, {"error": "not found"})
            return

        q = parse_qs(parsed.query)
        app_sym = (q.get("symbol") or [""])[0]
        tf = (q.get("tf") or ["1h"])[0]
        limit = int((q.get("limit") or ["300"])[0])

        mt5_sym = SYMBOL_MAP.get(app_sym)
        timeframe = TIMEFRAMES.get(tf)
        if not mt5_sym or timeframe is None:
            self._send(400, {"error": "unknown symbol or timeframe"})
            return

        with mt5_lock:
            rates = mt5.copy_rates_from_pos(mt5_sym, timeframe, 0, min(limit, 1000))

        if rates is None:
            self._send(502, {"error": "no data", "detail": str(mt5.last_error())})
            return

        candles = [
            {
                "t": int(r["time"]) * 1000,
                "o": float(r["open"]),
                "h": float(r["high"]),
                "l": float(r["low"]),
                "c": float(r["close"]),
                "v": float(r["tick_volume"]),
            }
            for r in rates
        ]
        self._send(200, {"symbol": app_sym, "tf": tf, "candles": candles})

    def log_message(self, *args) -> None:  # silence per-request logging
        pass


def start_http() -> None:
    server = ThreadingHTTPServer((HOST, HTTP_PORT), CandleHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(f"History API at http://{HOST}:{HTTP_PORT}/candles")


# ── WebSocket: live ticks ─────────────────────────────────────
async def broadcast(payload: dict) -> None:
    if not clients:
        return
    msg = json.dumps(payload)
    dead = set()
    for ws in clients:
        try:
            await ws.send(msg)
        except Exception:
            dead.add(ws)
    for ws in dead:
        clients.discard(ws)


async def poll_loop() -> None:
    while True:
        ticks = []
        for app_sym, mt5_sym in SYMBOL_MAP.items():
            with mt5_lock:
                t = mt5.symbol_info_tick(mt5_sym)
            if t is None or not t.bid:
                continue
            price = (t.bid + t.ask) / 2 if t.ask else t.bid
            op = opens.get(app_sym) or price
            ticks.append({
                "symbol": app_sym,
                "price": price,
                "bid": t.bid,
                "ask": t.ask,
                "changePct": ((price - op) / op * 100) if op else 0.0,
                "ts": int(time.time() * 1000),
            })
        if ticks:
            await broadcast({"type": "ticks", "data": ticks})
        await asyncio.sleep(POLL_SECONDS)


async def handler(ws) -> None:
    clients.add(ws)
    print(f"client connected ({len(clients)} total)")
    try:
        await ws.send(json.dumps({"type": "hello", "symbols": list(SYMBOL_MAP.keys())}))
        await ws.wait_closed()
    finally:
        clients.discard(ws)
        print(f"client disconnected ({len(clients)} total)")


async def main() -> None:
    if not init_mt5():
        return
    start_http()
    print(f"Bridge live at ws://{HOST}:{WS_PORT}  (Ctrl+C to stop)\n")
    async with websockets.serve(handler, HOST, WS_PORT):
        await poll_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nstopping…")
    finally:
        mt5.shutdown()