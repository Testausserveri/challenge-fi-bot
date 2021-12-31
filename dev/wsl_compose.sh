cd ..
export DOCKER_HOST=unix:///mnt/wsl/shared-docker/docker.sock
docker-compose -H unix:///mnt/wsl/shared-docker/docker.sock up --build-arg network=host
cd ./dev