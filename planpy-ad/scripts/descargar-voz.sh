#!/usr/bin/env bash
# Locución V4 (voz Xavier, ElevenLabs vía Higgsfield), un clip por bloque PAS.
# Descarga los clips a public/voz/. Luego: render con --props='{"voz":true}' (ver README).
set -euo pipefail
cd "$(dirname "$0")/../public/voz"
B=https://d8j0ntlcm91z4.cloudfront.net/user_3HEgcD5GC4CwhaagP0Q7DMWmCz8
while read -r name file; do
  curl -sSfL -o "$name.mp3" "$B/$file.mp3"
  echo "ok  $name"
done <<'LIST'
cierre-p hf_20260924_145409_95771d0e-017e-412a-b602-3ae2fb6a2a2e
cierre-a1 hf_20260924_145352_b847ae7d-4f09-4613-bcf6-695702ca3249
cierre-a2 hf_20260924_145353_d190c324-a8c4-47e5-9d93-ac2684ae26f7
cierre-s1 hf_20260924_151610_e640cd31-82aa-438d-8ce7-ef66546642d9
casa-s2 hf_20260924_145409_f85ba1c9-8879-4072-a310-2d864c769804
cta hf_20260924_151607_85e90d7e-7a4f-4d66-8bf5-7c5fa27a9d8a
caja-p hf_20260924_145352_c6020682-b878-4160-b731-dae16b89a43c
caja-a1 hf_20260924_145352_22724717-022b-456e-9e5a-e06dca876179
caja-a2 hf_20260924_145353_d23d21ba-7301-442e-857e-2db318a7ae91
caja-s1 hf_20260924_151607_6d86455e-18cd-4a7d-a7a4-587a12008e76
inventario-p hf_20260924_145353_f1f25d7a-7ddc-44d3-aafb-1098bd7c729c
inventario-a1 hf_20260924_145352_54a33dd3-4ac4-482f-99c4-3ec025f46bce
inventario-a2 hf_20260924_145401_bfae24b6-199d-4d7d-9b4a-89bf235000e5
inventario-s1 hf_20260924_151607_32c20b86-929a-45bb-9c74-2d5cfe3df7c7
inventario-s2 hf_20260924_145401_e0a2a0a7-dced-4e65-bdf6-406103210071
LIST
