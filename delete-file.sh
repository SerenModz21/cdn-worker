for url in "$@"
do
    curl -sX DELETE -H "Access-Token: $CDN_ACCESS_TOKEN" $url
done
