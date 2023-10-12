# If you haven't already, create this docker network:
# docker network create elastic
docker run \
--name es01 \
--net elastic \
-p 9200:9200 \
-e "discovery.type=single-node" \
-e "xpack.security.enabled=false" \
-it \
-d \
-m 512MB \
docker.elastic.co/elasticsearch/elasticsearch:8.10.3