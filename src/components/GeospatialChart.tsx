import mapboxgl from 'mapbox-gl';
import React, { useRef, useEffect, useState } from 'react';

import type { HealthEnvironmentData, HealthMetric } from '@/types';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

interface GeospatialChartProps {
  data: HealthEnvironmentData[];
    metric: HealthMetric;
    center: { latitude: number; longitude: number };
    zoom: number;
}

interface CustomLayerProperties extends mapboxgl.Layer {
  id: string;
  program?: WebGLProgram;
  buffer?: WebGLBuffer;
  aPos?: number;
  onAdd?: (map: mapboxgl.Map, gl: WebGLRenderingContext) => void;
  render?: (gl: WebGLRenderingContext, _matrix: number[]) => void;
}

const GeospatialChart: React.FC<GeospatialChartProps> = ({ data, metric, center, zoom }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [devicePerformance, setDevicePerformance] = useState<'low' | 'medium' | 'high'>('medium');


  useEffect(() => {
    const determineDevicePerformance = (): 'low' | 'medium' | 'high' => {
      const { hardwareConcurrency } = navigator;
      if (hardwareConcurrency <= 2) return 'low';
      if (hardwareConcurrency <= 4) return 'medium';
      return 'high';
    };
    setDevicePerformance(determineDevicePerformance());

    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [0, 0],
      zoom: 2,
      maxZoom: 18, // Set a default max zoom
      attributionControl: false, // We'll add this separately for more control
    });

      // Add attribution control
    map.current.addControl(new mapboxgl.AttributionControl({
        compact: true
    }), 'bottom-right');

    // Add navigation control (zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');


    map.current.on('load', () => {
      if (!map.current) return;

      // Add custom layer for fluid particle effects
      const customLayer: CustomLayerProperties = {
        id: 'fluid-particles',
        type: 'fill', // Adjusted to a valid type, choose the type that fits your use case

        onAdd: function (map: mapboxgl.Map, gl: WebGLRenderingContext) {
          const vertexSource = `
            attribute vec2 a_position;
            void main() {
              gl_Position = vec4(a_position, 0.0, 1.0);
            }
          `;

          const fragmentSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_health_score;

            vec2 random2(vec2 st){
              st = vec2(dot(st,vec2(127.1,311.7)),
                        dot(st,vec2(269.5,183.3)));
              return -1.0 + 2.0*fract(sin(st)*43758.5453123);
            }

            float noise(vec2 st) {
              vec2 i = floor(st);
              vec2 f = fract(st);

              vec2 u = f*f*(3.0-2.0*f);

              return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                               dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                          mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                               dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
            }

            void main() {
              vec2 st = gl_FragCoord.xy/u_resolution.xy;
              st.x *= u_resolution.x/u_resolution.y;

              vec3 color = vec3(0.0);
              
              vec2 pos = vec2(st*3.);

              float DF = 0.0;

              float a = 0.0;
              vec2 vel = vec2(u_time*.1);
              DF += noise(pos+vel)*.25+.25;

              a = noise(pos*vec2(cos(u_time*0.15),sin(u_time*0.1))*0.1)*3.1415;
              vel = vec2(cos(a),sin(a));
              DF += noise(pos+vel)*.25+.25;

              float healthFactor = smoothstep(0.4, 0.6, u_health_score);
              color = vec3( smoothstep(.7,.75,fract(DF)) );
              color = mix(vec3(0.1,0.1,0.9), vec3(0.9,0.1,0.1), healthFactor) * color;

              gl_FragColor = vec4(color, 1.0);
            }
          `;

          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader!, vertexSource);
          gl.compileShader(vertexShader!);

          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader!, fragmentSource);
          gl.compileShader(fragmentShader!);

          this.program = gl.createProgram()!;
          gl.attachShader(this.program, vertexShader!);
          gl.attachShader(this.program, fragmentShader!);
          gl.linkProgram(this.program);

          this.aPos = gl.getAttribLocation(this.program, "a_position");

          const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

          this.buffer = gl.createBuffer()!;
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer!);
          gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        },
        render: function (gl: WebGLRenderingContext, _matrix: number[]) {
          if (!this.program || !this.buffer || this.aPos === undefined) return;
          gl.useProgram(this.program);
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.enableVertexAttribArray(this.aPos);
          gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);

          gl.uniform2f(gl.getUniformLocation(this.program!, "u_resolution"), gl.canvas.width, gl.canvas.height);
          gl.uniform1f(gl.getUniformLocation(this.program!, "u_time"), performance.now() / 1000);
          gl.uniform1f(gl.getUniformLocation(this.program!, "u_health_score"), data[0][metric as keyof HealthEnvironmentData] as number / 100);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      };

      map.current.addLayer(customLayer as mapboxgl.LayerSpecification);

      // Add data points layer
      map.current.addSource('health-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: data.map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.longitude, point.latitude]
            },
            properties: {
              [metric]: point[metric]
            }
          }))
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'health-data',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'health-data',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', metric],
            0, '#51bbd6',
            50, '#f1f075',
            100, '#f28cb1'
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 2,
            16, 8
          ],
          'circle-opacity': 0.7
        }
      });
    });

    return () => map.current?.remove();
  }, [data, metric]);

  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const source = map.current.getSource('health-data') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: data.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude]
          },
          properties: {
            [metric]: point[metric]
          }
        }))
      });
    }

    map.current.setPaintProperty('unclustered-point', 'circle-color', [
      'interpolate',
      ['linear'],
      ['get', metric],
      0, '#51bbd6',
      50, '#f1f075',
      100, '#f28cb1'
    ]);

     return () => map.current?.remove();
  }, [data, metric]);

    useEffect(() => {
    if (!map.current || !center) return;

        map.current.setCenter([center.longitude, center.latitude]);
        map.current.setZoom(zoom);
    }, [center, zoom]);

  useEffect(() => {
    if (!map.current) return;

    switch (devicePerformance) {
      case 'low':
        map.current.setMaxZoom(10);
        break;
      case 'medium':
        map.current.setMaxZoom(14);
        break;
      case 'high':
        map.current.setMaxZoom(18);
        break;
    }
  }, [devicePerformance]);

    return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
    </div>
  );
};

export default GeospatialChart;