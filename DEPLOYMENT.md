# Docker deployment

Build the image from the project root:

```sh
docker build -t j277-revision-cards .
```

Run the container with the app available on host port 8080 and container port 80:

```sh
docker run -d --name j277-revision-cards --restart unless-stopped -p 8080:80 j277-revision-cards
```

Configure the existing reverse proxy to forward HTTP traffic to the server on port 8080. Nginx inside the container serves the static web app on port 80. The app currently needs no database, API service, or environment variables.
