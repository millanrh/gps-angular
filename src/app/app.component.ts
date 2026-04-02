import { Component, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements AfterViewInit {
  private map!: L.Map;
  private markers: L.LatLng[] = [];
  private routingControl: any = null;  
  public infoDistancia: string | null = null;
  
  private customIcon = L.icon({
  iconUrl: '/img/icono.png', // public se omite
  iconSize: [38, 38],       // Tamaño del icono [ancho, alto]
  iconAnchor: [19, 38],     // Punto del icono que se coloca sobre la coordenada (mitad ancho, base alto)
  popupAnchor: [0, -38],     // Punto desde donde se abre el popup relativo al anchor
  shadowUrl: ''
});

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([10.15, -64.7], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addLocation(e.latlng);
    });

    setTimeout(() => this.map.invalidateSize(), 100);
  }

  private addLocation(latlng: L.LatLng) {
  if (this.markers.length >= 2) {
    this.resetMap();
  }

  this.markers.push(latlng);

  // Dibujamos tu marcador personalizado en el clic
  L.marker(latlng, { icon: this.customIcon }).addTo(this.map);

  if (this.markers.length === 2) {
    this.calculateRoute();
  }
}

  private calculateRoute() {
  if (this.routingControl) {
    this.map.removeControl(this.routingControl);
  }

  // Usamos (L.Routing as any) para saltar errores de compilación de tipos
  this.routingControl = (L.Routing as any).control({
    waypoints: [
      L.latLng(this.markers[0].lat, this.markers[0].lng),
      L.latLng(this.markers[1].lat, this.markers[1].lng)
    ],
    // ESTA PARTE REEMPLAZA LOS MARCADORES AZULES POR TU JPEG
    createMarker: (i: number, waypoint: any, n: number) => {
      return L.marker(waypoint.latLng, {
        draggable: true,
        icon: this.customIcon
      });
    },
    lineOptions: {
      styles: [{ color: '#3388ff', weight: 6, opacity: 0.8 }],
      extendToWaypoints: true,
      missingRouteTolerance: 0
    },
    show: false,
    addWaypoints: false
  })
  .on('routesfound', (e: any) => {
    // IMPORTANTE: e.routes es el array, extraemos la primera ruta
    const rutaEncontrada = e.routes[0];
    const summary = rutaEncontrada.summary;
    
    // Calculamos y asignamos a la variable pública
    const km = (summary.totalDistance / 1000).toFixed(2);
    const min = Math.round(summary.totalTime / 60);
    
    // Forzamos la actualización de la vista
    this.infoDistancia = `${km} km (${min} min aprox.)`;

    // Ajuste de zoom a la ruta
    const bounds = L.latLngBounds(rutaEncontrada.coordinates);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  })
  .addTo(this.map);
}

  private addMarker(latlng: L.LatLng) {
    if (this.markers.length >= 2) {
      this.resetMap();
    }

  const etiqueta = this.markers.length === 0 ? 'Punto A' : 'Punto B';  

  const marker = L.circleMarker(latlng, {
    radius: 10,
    fillColor: this.markers.length === 0 ? "#28a745" : "#dc3545", // Verde para A, Rojo para B
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9
  })
    .addTo(this.map)
    .bindPopup(`<b>${etiqueta}</b>`)
    .openPopup();    
    this.markers.push(latlng);   
  }  

  public resetMap() {
  // 1. Eliminar el control de rutas (esto quita la línea y sus marcadores automáticos)
  if (this.routingControl) {
    this.map.removeControl(this.routingControl);
    this.routingControl = null;
  }
  // 2. Limpiar los círculos manuales que dibujamos al hacer clic
  this.map.eachLayer((layer) => {
  // Limpia marcadores, círculos y líneas
  if (layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
    this.map.removeLayer(layer);
  }
});
  // 3. Reiniciar las variables de estado
  this.markers = [];
  this.infoDistancia = null;
  // Opcional: Volver a la vista inicial después de limpiar
  this.map.setView([10.15, -64.7], 13); 
}
  
}



