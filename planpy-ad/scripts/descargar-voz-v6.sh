#!/usr/bin/env bash
# Locución V6 servicios (voz Xavier). Descarga a public/voz/v6/.
set -euo pipefail
cd "$(dirname "$0")/../public" && mkdir -p voz/v6 && cd voz/v6
B=https://d8j0ntlcm91z4.cloudfront.net/user_3HEgcD5GC4CwhaagP0Q7DMWmCz8
while read -r name file; do
  curl -sSfL -o "$name.mp3" "$B/$file.mp3" && echo "ok  $name"
done <<'LIST'
barberia-h1 hf_20260924_160528_6f6af337-b827-4750-8dd9-ee1eab62eb8e
barberia-a1 hf_20260924_160529_355857ea-09d1-42ab-8479-8818969d2b73
barberia-a2 hf_20260924_160529_f4c74466-e9a3-4f3e-9a5f-e361a7398d9d
barberia-s1 hf_20260924_160529_80963149-d903-4922-9594-b7c618dba4c8
recordatorio-s2 hf_20260924_160530_bf1ca86f-c826-4116-8c83-01d163ffeae4
barberia-d hf_20260924_160528_23b55d58-ac23-4208-beee-2a04d4d03a5a
salon-h1 hf_20260924_160529_4616fe72-085c-41b5-b57e-f217bce7aa9a
salon-a1 hf_20260924_160529_3adf69a3-4864-43d2-92fe-da8852df77e3
salon-a2 hf_20260924_160529_b6304846-9e75-40d8-8261-5b53b4862030
salon-s1 hf_20260924_160543_51e7b3ae-d09c-44bc-a1ac-83f6092647ab
salon-s2 hf_20260924_160542_9b48c7b2-2af0-4a02-a613-c0de72084830
salon-d hf_20260924_160543_6b8fcb8b-77f3-444d-b71e-a20d45ff85ef
mascotas-h1 hf_20260924_160543_9707d96a-137f-4b7b-8254-36e4d67e0f1d
mascotas-a1 hf_20260924_160542_fe5e4cd2-4c58-4211-a3e3-6c37ea0d88f0
mascotas-a2 hf_20260924_160551_b1c410b8-7626-4af8-a381-17ec9d738c33
mascotas-s1 hf_20260924_160543_d0a3981a-1f46-4f02-85da-086491c2e5c7
mascotas-d hf_20260924_160542_6d4dfa4d-ca04-40b8-8ecf-e779d67a91cf
LIST
