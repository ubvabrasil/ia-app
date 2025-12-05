#!/usr/bin/env bash
# Exemplos HTTP / curl e HTTPie para os endpoints da API

BASE="http://localhost:3000"

echo "GET sessions"
curl -s "$BASE/api/session" | jq '.' || true

echo "POST create session"
curl -s -X POST -H "Content-Type: application/json" -d '{"id":"123","name":"João"}' "$BASE/api/session" | jq '.' || true

echo "POST message"
curl -s -X POST -H "Content-Type: application/json" -d '{"sessionId":"123","role":"user","content":"Olá"}' "$BASE/api/message" | jq '.' || true

echo "GET messages for session 123"
curl -s "$BASE/api/session/123/messages" | jq '.' || true

echo "GET session summary"
curl -s "$BASE/api/session/summary" | jq '.' || true

echo "GET session dates"
curl -s "$BASE/api/session/dates" | jq '.' || true

echo "GET config"
curl -s "$BASE/api/config" | jq '.' || true

echo "POST webhook (example)"
curl -s -X POST -H "Content-Type: application/json" -d '{"sessionId":"123","message":"Olá"}' "$BASE/api/webhook" | jq '.' || true

echo "PUT session (create/replace)"
curl -s -X PUT -H "Content-Type: application/json" -d '{"id":"123","name":"Nome Atualizado"}' "$BASE/api/session" | jq '.' || true

echo "PATCH session"
curl -s -X PATCH -H "Content-Type: application/json" -d '{"id":"123","name":"Nome Parcial"}' "$BASE/api/session" | jq '.' || true

echo "DELETE session"
curl -s -X DELETE "$BASE/api/session?id=123" | jq '.' || true

echo "PATCH message"
curl -s -X PATCH -H "Content-Type: application/json" -d '{"id":"msg-id","content":"Texto corrigido"}' "$BASE/api/message" | jq '.' || true

echo "DELETE message"
curl -s -X DELETE "$BASE/api/message?id=msg-id" | jq '.' || true

echo "DELETE webhook config"
curl -s -X DELETE "$BASE/api/webhook/config" | jq '.' || true

# HTTPie examples (if you prefer httpie, uncomment and run)
# http $BASE/api/session
# http POST $BASE/api/session id=123 name="João"
# http POST $BASE/api/message sessionId=123 role=user content='Olá'
