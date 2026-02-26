# Roadmap

AIForge（社内開発MCPサーバー）から公式MCPサーバーへの機能移行ロードマップです。

## Phase 1: データ取得（生データ） ✅ 完了

| ツール | API | 概要 |
|--------|-----|------|
| get_ticker | /{pair}/ticker | 単一ペアのティッカー |
| get_tickers_jpy | /tickers_jpy | 全JPYペアのティッカー |
| get_candles | /{pair}/candlestick | ローソク足（OHLCV） |
| get_depth | /{pair}/depth | 板の生データ |
| get_transactions | /{pair}/transactions | 約定履歴 |

## Phase 2: データ取得（加工）

| ツール | 概要 |
|--------|------|
| get_orderbook | 板（上位N層）正規化・累計 |
| get_orderbook_pressure | 買い/売り圧力比 |
| get_orderbook_statistics | 板の厚み・流動性分布 |
| get_flow_metrics | CVD/アグレッサー比/スパイク |
| get_volatility_metrics | RV/ATRなどボラティリティ |

## Phase 3: 分析（単体指標）

| ツール | 概要 |
|--------|------|
| analyze_indicators | SMA/RSI/BB/一目/MACD |
| analyze_ichimoku_snapshot | 一目スナップショット |
| analyze_bb_snapshot | BB状態分析 |
| analyze_sma_snapshot | SMA整列/クロス分析 |
| analyze_macd_pattern | MACD形成状況 |
| analyze_candle_patterns | 2本足パターン検出 |
| analyze_support_resistance | サポレジ自動検出 |

## Phase 4: 分析（複合・スクリーニング）

| ツール | 概要 |
|--------|------|
| analyze_market_signal | 総合スコア（-100〜+100） |
| detect_patterns | 全13パターン検出 |
| detect_macd_cross | MACDクロス銘柄スクリーニング |
| detect_whale_events | 大口取引イベント推定 |

## Phase 5: 表示

| ツール | 概要 |
|--------|------|
| render_chart_svg | チャートSVG描画 |
| render_depth_svg | 板の深度SVG描画 |

## Phase 6: Prompts（初心者向け）

| Prompt | 概要 |
|--------|------|
| beginner_market_check | 今、買い時？売り時？ |
| beginner_chart_view | チャートの見方を解説 |
| beginner_trend_check | 上昇？下降？横ばい？ |

## Phase 7: Prompts（中級者向け）

| Prompt | 概要 |
|--------|------|
| multi_factor_signal | マルチファクターシグナル |
| 主要指標分析 | RSI/MACD/BB/一目/SMA総合 |
| フロー分析 | CVD/aggressor ratio |
| 板分析 | 板の厚み・流動性・大口 |
| パターン分析 | 複数時間軸パターン検出 |
| サポレジ分析 | 価格帯の強弱統合分析 |
