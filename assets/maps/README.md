# 本地足迹地图

`countries.geojson` 来自 Natural Earth 的 1:110m 国家边界，保留几何与国家标识，移除不使用的属性。

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Public domain: https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-10-03

`china-provinces.geojson` 提取 Natural Earth 1:50m 数据中的中国省级边界，仅保留名称和几何，坐标保留三位小数（约 130 KB）。

- Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_1_states_provinces.geojson
- Public domain: https://www.naturalearthdata.com/about/terms-of-use/
- Retrieved: 2026-10-03

`places.json` 保留原有城市与学习节点，新增用户确认去过的佛山、惠州、深圳、广州、东莞、台湾与圣米歇尔山。台湾坐标仅代表地区；未推断具体城市。未添加出行日期或顺序。新增地点的地图定位坐标参考 Wikidata 条目 Q34412、Q59173、Q15174、Q16572、Q59218、Q22502、Q20883。

- Coordinate sources: https://www.wikidata.org/wiki/Q34412 , https://www.wikidata.org/wiki/Q59173 , https://www.wikidata.org/wiki/Q15174 , https://www.wikidata.org/wiki/Q16572 , https://www.wikidata.org/wiki/Q59218 , https://www.wikidata.org/wiki/Q22502 , https://www.wikidata.org/wiki/Q20883

海浪纹理、山峰、帆船、建筑线稿是旅行主题装饰；圣米歇尔山修道院图标对应真实地图点。广东五个城市在概览缩放下合并为可点击的岭南标记，放大后显示各城市。地图展示地域概览、足迹与节点关系，保留本地 Leaflet 1.9.4 的拖动、缩放、城市定位和还原视野。
