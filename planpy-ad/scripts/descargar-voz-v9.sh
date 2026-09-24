#!/usr/bin/env bash
# Locución V9 proveedores (Xavier; proveedor = Andre). Descarga a public/voz/v9/.
set -euo pipefail
cd "$(dirname "$0")/../public" && mkdir -p voz/v9 && cd voz/v9
B=https://d8j0ntlcm91z4.cloudfront.net/user_3HEgcD5GC4CwhaagP0Q7DMWmCz8
while read -r name file; do curl -sSfL -o "$name.mp3" "$B/$file.mp3" && echo "ok  $name"; done <<'LIST'
c-h hf_20260924_173422_033c20ec-a791-4181-ab68-7dd8c8d777ec
c-p hf_20260924_173422_250c8b35-9f4a-4a61-9a37-6466cf6565ed
c-a hf_20260924_173422_e7c47143-4087-4abf-a21c-02a966a1cd2e
c-s1 hf_20260924_173421_62156f60-4af0-49ee-89d3-1d0c7f6e9b0c
c-s2 hf_20260924_173422_215e0450-4f60-4483-bfb4-629b37bb8687
c-d hf_20260924_173421_41b38cbc-76cb-4dc0-b8c9-b7b3df8ef3af
a-h hf_20260924_173427_8484e563-db1c-46d1-8ab1-473f1a7ad7bb
a-prov hf_20260924_173427_494782a0-168d-48c8-b657-4e602c3087db
a-a1 hf_20260924_173427_41aeb0a4-45dd-42cd-abc8-adf4ad37d585
a-a2 hf_20260924_173427_92f32632-58d2-47dc-ba8e-447f9d05bb4a
a-s1 hf_20260924_173428_862a2939-86a3-45d3-9606-893f17a4c67a
a-s2 hf_20260924_173427_1c346c7c-b294-467b-9ccb-252e55e5afc7
LIST
