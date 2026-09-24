#!/usr/bin/env bash
# Locución V10 tienda de ropa (Xavier). Descarga a public/voz/v10/.
set -euo pipefail
cd "$(dirname "$0")/../public" && mkdir -p voz/v10 && cd voz/v10
B=https://d8j0ntlcm91z4.cloudfront.net/user_3HEgcD5GC4CwhaagP0Q7DMWmCz8
while read -r name file; do curl -sSfL -o "$name.mp3" "$B/$file.mp3" && echo "ok  $name"; done <<'LIST'
a-h hf_20260924_182423_5d42203b-de93-47f9-b5a9-7ccbe4109ebb
a-p hf_20260924_182422_41b1ec90-a87d-4426-b79c-0a93175b6aa2
a-a hf_20260924_182423_7a5ad870-04da-4fc5-a42c-e4cc2bf6615d
a-s1 hf_20260924_182421_9a246159-2bf6-4ca0-8aac-382dc9b884b1
a-s2 hf_20260924_182422_a8f7abd0-9745-41a7-bab6-3bdcdb8f1390
e-h hf_20260924_182422_7d7227e0-1752-4710-b268-20725847e789
e-p hf_20260924_182427_0302851d-e0d2-460f-a546-8425f219d3f7
e-a hf_20260924_182427_7be84377-dec9-46cd-a650-5f194b2fe90e
e-s1 hf_20260924_182427_5c97289d-86aa-4e3a-b4d1-0490e7efffd2
e-s2 hf_20260924_182427_64a4a9dc-48b7-4042-901f-5877fcd97dc0
LIST
