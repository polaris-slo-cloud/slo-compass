# Evaluation Testbed Setup
``` sh
minikube addons enable ingress
minikube addons enable registry
kubectl port-forward -n kube-system service/registry 5000:80
helm install prometheus prometheus-community/kube-prometheus-stack
helm upgrade --install ingress-nginx ingress-nginx --repo https://kubernetes.github.io/ingress-nginx --namespace ingress-nginx --create-namespace
```

Redirect traffic to port 5000 to minikube registry by starting a docker container

```sh
docker run -d --rm -it --network=host alpine ash -c "apk add socat && socat TCP-LISTEN:5000,reuseaddr,fork TCP:host.docker.internal:5000"
```

In order to access the applications locally run `kubectl port-forward svc/ingress-nginx-controller -n ingress-nginx 8080:80`