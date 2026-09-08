import json,re,html
from pathlib import Path
root=Path(__file__).resolve().parents[1];dist=root/'dist'; js=next((dist/'assets').glob('*.js')); css=next((dist/'assets').glob('*.css'))
data={n:json.loads((root/'public/data'/f'{n}.json').read_text()) for n in ['terrain','city-terrain','map','river','coastal']}
blob=json.dumps(data,separators=(',',':'),ensure_ascii=False)
code=js.read_text();code=code.replace('fetch(`/data/${F}.json`)', 'Promise.resolve({json:()=>Promise.resolve(window.__DATA__[F])})')
page='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>连江 · 江海之间 | 交互式三维地图</title><style>'''+css.read_text()+'''</style></head><body>'''+(dist/'index.html').read_text().split('<body>',1)[1].split('<script',1)[0]+f'''<script>window.__DATA__={blob}</script><script>{code}</script></body></html>'''
out=root/'dist/share-lianjiang.html';out.write_text(page);print(out,round(out.stat().st_size/1024/1024,1),'MB')
