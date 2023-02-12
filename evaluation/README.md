# Evaluation Testbed Setup
0. Setting up VNC for Gnome
``` sh
sudo apt install dbus-x11
sudo apt install tigervnc-standalone-server tigervnc-xorg-extension
sudo apt install xserver-xorg-core
vncpasswd
mv ~/.vnc/xstartup ~/.vnc/xstartup.bak
nano ~/.vnc/xstartup
```
Copy the following contents into the `xstartup` file
```
#!/bin/sh

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
xsetroot -solid grey

#export DESKTOP_SESSION=gnome
export XKL_XMODMAP_DISABLE=1
exec /etc/X11/xinit/xinitrc

vncconfig -iconic &
dbus-launch --exit-with-session gnome-session -- --disable-acceleration-check
```
``` sh
chmod +x ~/.vnc/xstartup
nano /etc/systemd/system/vncserver@.service
```
Copy the following contents into the `vncserver@.service` file

```
[Unit]
Description=VNC Server Setup
After=syslog.target network.target

[Service]
Type=forking
User=user

ExecStart=/usr/bin/vncserver -geometry 1920x1080 -localhost :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
```

``` sh
sudo systemctl enable vncserver@1
sudo systemctl start vncserver@1
```
In case this does not work, start it manually: 
``` sh
vncserver -geometry 1920x1080 -localhost :1
```
Increase Screensaver Timeout so VNC doesn't lock the user out
``` sh
gsettings set org.gnome.desktop.session idle-delay 3600
gsettings set org.gnome.desktop.screensaver lock-delay 0
```
## OBSOLETE (Enable RDP through CLI)
``` sh
grdctl rdp enable
grdctl rdp disable-view-only
grdctl rdp set-credentials <USERNAME> <PASSWORD>
```
1. Install MicroK8s
``` sh
sudo snap install microk8s --classic
microk8s status --wait-ready
sudo usermod -a -G microk8s user
sudo chown -R user ~/.kube
newgrp microk8s
```

2. Enable MicroK8s plugins
``` sh
microk8s enable dns rbac metrics-server registry
```
3. Install Kubectl
``` sh 
sudo snap install kubectl --classic
microk8s config > ~/.kube/config
```
4. Install the Prometheus Helm chart
``` sh
microk8s helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
microk8s helm repo update
microk8s helm install prometheus prometheus-community/kube-prometheus-stack
```
5. Install Docker
``` sh
sudo snap install docker
sudo addgroup --system docker
sudo adduser $USER docker
newgrp docker
sudo snap disable docker
sudo snap enable docker
```
Afterwards log out and log back in

6. Copy Polaris UI Evaluation Setup
``` sh
scp ./evaluation-setup.zip user@128.131.57.174:~/Downloads/
cd Downloads
unzip evaluation-setup.zip
mv ./evaluation ../
``` 

7. Install Dotnet for Building Evaluation Containers
``` sh
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb
sudo apt update
sudo apt install -y dotnet-sdk-7.0
```
8. Build the Evaluation Containers
``` sh
cd ./evaluation
sh build-containers.sh
```
9. Deploy the Evaluation Containers in the MicroK8s cluster
``` sh
sh deploy-containers.sh
```

10. Copy Polaris UI Build Artifact and install Polaris UI
``` sh
scp ./polaris-ui.zip user@128.131.57.174:~/Downloads/
cd Downloads
unzip polaris-ui.zip
mv dist_electron/ polaris-ui/
```

11. Setup Port Forwarding to the Prometheus Service
> **NOTE:** Has to be setup after every restart or after the console session has been closed
``` sh
kubectl port-forward svc/prometheus-kube-prometheus-prometheus 9090:9090
```

# Evaluation Minikube setup - OBSOLETE
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