# 馃幃 涔愪箰鐢电珵 路 涓夎娲查櫔鐜╂帴鍗曞钩鍙?
> 涓€涓潰鍚戙€婁笁瑙掓床琛屽姩銆嬫父鎴忕殑闄帺鎺ュ崟骞冲彴锛?*鐜╁绔笅鍗曞墠鍙?* + **宸ヤ綔瀹ょ鐞嗗悗鍙?*銆?> 鍩轰簬 [Guyungy/Kuangniao](https://github.com/Guyungy/Kuangniao)锛圡IT锛変簩娆″紑鍙戯紝鍝佺墝鏀归€犱负銆屼箰涔愮數绔炪€嶃€?
| 鎶€鏈爤 | 馃敡 |
| --- | --- |
| 鐜╁绔墠鍙?| Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router |
| 绠＄悊鍚庡彴 | Vue 3 + Vite + TypeScript + Element Plus + ECharts |
| 鍚庣 API | Node.js + TypeScript + Express + sequelize-typescript |
| 鏁版嵁搴?| MySQL 8锛坲tf8mb4锛?|
| 璁よ瘉 | JWT锛堢鐞嗗憳 / 鐜╁鍙屼綋绯伙級 |
| 閮ㄧ讲 | Docker Compose锛涘墠绔彲鍙戝竷涓洪潤鎬佺珯鐐?|

---

## 馃摝 鐩綍缁撴瀯

```
lele-esports/
鈹溾攢鈹€ frontend/      # 绠＄悊鍚庡彴锛堜細鍛?璁㈠崟/鍏呭€?鎵撴墜/鎶ヨ〃/浣ｉ噾/璇勪环锛?鈹溾攢鈹€ storefront/    # 鐜╁绔墠鍙帮紙闄帺骞垮満/涓嬪崟/璁㈠崟/璇勪环/涓汉涓績锛?鈹溾攢鈹€ backend/       # Express + TS 鍚庣 API
鈹?  鈹溾攢鈹€ src/routes/storefront.ts   # 鐜╁搴楅摵鎺ュ彛
鈹?  鈹斺攢鈹€ src/models/Review.ts       # 璇勪环妯″瀷
鈹溾攢鈹€ payboard.sql   # 鏁版嵁搴撹〃缁撴瀯
鈹溾攢鈹€ docker-compose.yml
鈹斺攢鈹€ docs/          # 璇存槑鏂囨。
```

## 鉁?宸插疄鐜板姛鑳?
### 鐜╁绔紙storefront锛宍http://localhost:3002`锛?- 鎵嬫満鍙?+ 瀵嗙爜**娉ㄥ唽 / 鐧诲綍**锛圝WT锛?- **闄帺骞垮満**锛氭寜绫诲瀷绛涢€夈€佸叧閿瘝鎼滅储銆佹煡鐪嬩环鏍?绾у埆/鏍囩
- **闄帺璇︽儏**锛氳瘎鍒嗘槦绾с€佽瘎浠峰垪琛ㄣ€佺珛鍗充笅鍗?- **涓嬪崟**锛氶€夋嫨鏈嶅姟鏃堕暱 鈫?妯℃嫙鏀粯 鈫?鐢熸垚璁㈠崟
- **鎴戠殑璁㈠崟**锛氳鍗曠姸鎬佽窡韪紙寰呬笂閽?鏈嶅姟涓?宸插畬鎴?宸插彇娑堬級銆佸彇娑堛€?*璁㈠崟璇勪环**
- **涓汉涓績**锛氫綑棰濄€佺疮璁″厖鍊?娑堣垂銆佸熀鏈俊鎭?
### 绠＄悊鍚庡彴锛坒rontend锛宍http://localhost:3001`锛?- 浼氬憳绠＄悊銆佸厖鍊肩鐞嗐€佽鍗曠鐞嗭紙涓婇挓/涓嬮挓锛夈€佹墦鎵嬬鐞嗐€佹墦鎵嬪璐?- 浣ｉ噾瑙勫垯銆佹暟鎹姤琛紙浠婃棩姒傝/瓒嬪娍/鎺掕姒滐級銆佺郴缁熺鐞嗭紙鐢ㄦ埛/瑙掕壊锛?- 鏁版嵁鍙鍖栵紙ECharts锛?
### 鍚庣 API锛坄http://localhost:10000/api/v1`锛?- 绠＄悊鍛樿璇?`/auth`銆乣/users`銆乣/roles`
- 涓氬姟 `/members`銆乣/orders`銆乣/recharges`銆乣/workers`銆乣/reports`銆乣/commission-rules`
- 鐜╁搴楅摵 `/store`锛氭敞鍐?鐧诲綍銆侀櫔鐜╁垪琛?璇︽儏銆佷笅鍗曘€佹垜鐨勮鍗曘€佽瘎浠?
---

## 馃殌 蹇€熷紑濮?
### 鐜瑕佹眰
- Node.js 18+
- MySQL 8.0+
- pnpm 8+

### 1. 鍒濆鍖栨暟鎹簱
```bash
mysql -uroot -p -e "CREATE DATABASE payboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -uroot -p payboard < payboard.sql
```

### 2. 鍚姩鍚庣
```bash
cd backend
cp .env.example .env      # 淇敼 DB_HOST/DB_PASSWORD 绛?pnpm install
pnpm run build
node dist/app.js          # http://localhost:10000
```
棣栨鍚姩浼氳嚜鍔ㄥ缓琛ㄥ苟鍒涘缓榛樿绠＄悊鍛橈細`admin / admin123`锛堝彲鍦?`.env` 鎴栫櫥褰曞悗淇敼锛夈€?
### 3. 鍚姩绠＄悊鍚庡彴
```bash
cd frontend
pnpm install
node node_modules/vite/bin/vite.js   # http://localhost:3001
```
鐧诲綍锛歚admin` / `123456`

### 4. 鍚姩鐜╁绔墠鍙?```bash
cd storefront
pnpm install
node node_modules/vite/bin/vite.js   # http://localhost:3002
```

> 鎻愮ず锛氬悗鍙伴粯璁ゅ瘑鐮?`123456` 涓庣櫥褰曡〃鍗曚竴鑷达紱濡傚師鍏堢敤 `sync-database` 鍒濆鍖栧垯涓?`admin123`銆?
---

## 馃惓 Docker 涓€閿儴缃?
浠撳簱鑷甫 `docker-compose.yml`锛屼竴閿惎鍔?MySQL + 鍚庣 + 鍓嶇 + phpMyAdmin锛?```bash
docker compose up -d --build
```

---

## 馃攼 璐﹀彿璇存槑
- **绠＄悊鍚庡彴**锛歚admin` / `123456`锛堥粯璁わ紝鐢熶骇鐜璇蜂慨鏀癸級
- **鐜╁娉ㄥ唽**锛氬墠鍙拌嚜琛屾敞鍐?
## 馃搫 License
[MIT](./LICENSE)

## 馃檹 鑷磋阿
鏈」鐩熀浜?[Guyungy/Kuangniao](https://github.com/Guyungy/Kuangniao)锛堝師涓婃父涓?Vue3 鍚庡彴妯℃澘鐢熸€侊級浜屾寮€鍙戞敼杩涳紝鎰熻阿涓婃父寮€婧愩€?