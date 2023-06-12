import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import * as createREGL from 'regl';

@Component({
  selector: 'app-embedding-scatter',
  templateUrl: './embedding-scatter.component.html',
  styleUrls: ['./embedding-scatter.component.scss']
})
export class EmbeddingScatterComponent implements AfterViewInit {
  @ViewChild('plot') plotElement!: ElementRef;

  data: any[] = [];
  defaultRadius: number = 0.3;

  constructor(private http: HttpClient) { }

  ngAfterViewInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>('/assets/data.json').subscribe((data) => {
      this.data = data;
      this.createChart();
    });
  }

  private createChart(): void {

    const regl = createREGL(this.plotElement.nativeElement);

    const width = 800; // Canvas width
    const height = 600; // Canvas height

    // Set the canvas size
    this.plotElement.nativeElement.width = width;
    this.plotElement.nativeElement.height = height;

    const data = new Array(1000000).fill(0).map(() => ({
      x: Math.random(),
      y: Math.random()
    }));

    const points = data.map(d => [d.x * 2 - 1, d.y * 2 - 1]);

    const drawPoints = regl({
      frag: `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0, 1, 0, 1); // Color of points (Green)
    }`,

      vert: `
    precision mediump float;
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }`,

      attributes: {
        position: points
      },

      count: points.length,

      primitive: 'points'
    });

    regl.frame(() => {
      regl.clear({
        color: [0, 0, 0, 1], // Background color (White)
        depth: 1
      });

      drawPoints();
    });
  }
}
