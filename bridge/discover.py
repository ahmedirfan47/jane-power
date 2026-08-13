"""Print the symbols this MT5 account actually offers, so we can map them correctly."""
import MetaTrader5 as mt5

if not mt5.initialize():
    print("MT5 initialize() failed:", mt5.last_error())
    print("Make sure the MetaTrader 5 terminal is OPEN and logged in.")
    raise SystemExit(1)

info = mt5.account_info()
print(f"Connected: account {info.login} @ {info.server}\n")

symbols = mt5.symbols_get()
print(f"{len(symbols)} symbols available.\n")

keywords = ("XAU", "GOLD", "XAG", "SILVER", "EURUSD", "GBPUSD", "USDJPY",
            "AUDUSD", "USDCAD", "NAS", "SPX", "US30", "GER", "DAX", "JP225",
            "WTI", "OIL", "NGAS", "USTEC", "US500")

print("--- Likely matches ---")
for s in symbols:
    if any(k in s.name.upper() for k in keywords):
        print(f"  {s.name:<20} {s.description}")

mt5.shutdown()