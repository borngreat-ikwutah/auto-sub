curl https://api.venice.ai/api/v1/chat/completions \
 --header "Authorization: Bearer VENICE_INFERENCE_KEY_Pq8TLnC25QiVTB3CH4Vn1XBxT6vAtX079x3FRVMl9F" \
 --header "Content-Type: application/json" \
 --data '
{
"model": "venice-uncensored",
"messages": [
{"role": "user", "content": "What makes you different from other AIs?"}
]
}'
