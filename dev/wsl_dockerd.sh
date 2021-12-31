# WSL Dockerd
mkdir -p /mnt/wsl/shared-docker
DOCKER_DIR=/mnt/wsl/shared-docker
chgrp docker "$DOCKER_DIR"
dockerd &
docker -H unix:///mnt/wsl/shared-docker/docker.sock run --rm hello-world
echo "Configured."