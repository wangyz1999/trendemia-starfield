import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// import * as d3 from 'd3';
// import * as createREGL from 'regl';
import createScatterplot from 'regl-scatterplot';
import { min } from 'd3';
import { scaleLog } from 'd3-scale';
// import { DataService } from './data.service';
import { checkSupport } from './utils';


@Component({
  selector: 'app-embedding-scatter',
  templateUrl: './embedding-scatter.component.html',
  styleUrls: ['./embedding-scatter.component.scss']
})

export class EmbeddingScatterComponent implements AfterViewInit {
  @ViewChild('plot') plotElement!: ElementRef;

  points: any[] = [];
  metadata: any[] = [];
  defaultRadius: number = 0.3;
  colorList: string[] = [];
  showBox: boolean = false;
  selectedPoint: { title: string, date: number, id: string, categories: string } = { title: '', date: 0, id: '', categories: '' };


  constructor(private http: HttpClient) { }

  ngAfterViewInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any>('/assets/arxiv_categories.json').subscribe((categories) => {

      const categoriesArray: Array<[number, string]> = [];
      for (const [key, value] of Object.entries(categories)) {
        const category = value as { id: number, color: string };
        categoriesArray.push([category.id, category.color]);
      }
      // create colorlist from categoriesArray sort by id
      this.colorList = categoriesArray.sort((a, b) => a[0] - b[0]).map((x) => x[1]);

      this.http.get<Array<{ x: number, y: number, cite: number, categories: string, title: string, date: number, id: string }>>('/assets/arxiv_embedding_top.json').subscribe((data) => {

        // Initialize minCite and maxCite
        let minCite = Infinity;
        let maxCite = -Infinity;

        // Find the minimum and maximum cite values in a single pass
        for (const entry of data) {
          if (entry.cite < minCite) minCite = entry.cite;
          if (entry.cite > maxCite) maxCite = entry.cite;
        }

        // Convert and scale the data into the desired format using a for loop
        this.points = [];
        for (const entry of data) {
          const scaledCite = (entry.cite - minCite) / (maxCite - minCite);
          if (!categories[entry.categories.split(' ')[0]]) {
            continue
          }
          const categoryColor = categories[entry.categories.split(' ')[0]].id;
          this.points.push([entry.x, entry.y, categoryColor, scaledCite]);
          this.metadata.push({ title: entry.title, date: entry.date, id: entry.id, categories: entry.categories });
        }

        // Proceed to create the chart
        this.createChart();
      });
    });
  }

  private createChart(): void {

    const canvas = this.plotElement.nativeElement;

    const { width, height } = canvas.getBoundingClientRect();

    let opacityByDensityFill = 0.3;
    let selection: any[];

    const lassoMinDelay = 10;
    const lassoMinDist = 2;
    const showReticle = true;
    const reticleColor = [1, 1, 0.878431373, 0.33];

    const selectHandler = ({ points: selectedPoints }: { points: any[] }) => {
      console.log('Selected:', selectedPoints);
      selection = selectedPoints;
      if (selection.length === 1) {
        const point = this.points[selection[0]];
        const metadata = this.metadata[selection[0]];
        this.selectedPoint = { title: metadata.title, date: metadata.date, id: metadata.id, categories: metadata.categories };
        console.log(
          `X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${point[3]}`
        );
      }
      this.showBox = true;
    };

    const deselectHandler = () => {
      console.log('Deselected:', selection);
      selection = [];
      this.showBox = false;
    };

    const scatterplot = createScatterplot({
      canvas,
      opacityByDensityFill,
      pointColorHover: [0.5, 0.5, 0.5, 0.5],
      pointSizeSelected: 11,
      pointOutlineWidth: 3
    });

    checkSupport(scatterplot);

    scatterplot.subscribe('select', selectHandler);
    scatterplot.subscribe('deselect', deselectHandler);

    const getPointSizeRange = (basePointSize: number) => {
      const pointSizeScale = scaleLog()
        .domain([1, 10])
        .range([basePointSize, basePointSize * 10]);

      return Array(100)
        .fill(0)
        .map((x, i) => pointSizeScale(1 + (i / 99) * 9));
    };

    scatterplot.set({
      sizeBy: 'value',
      // pointSize: Array.from({ length: 20 }, (_, i) => Math.pow(30, i / (20 - 1)) * 1)
      pointSize: getPointSizeRange(1.3)
      // pointSize: [1, 2, 3, 10, 40]
    });

    scatterplot.set({
      opacityBy: 'density',
    });

    scatterplot.set({ colorBy: 'category', pointColor: this.colorList });
    scatterplot.draw(this.points);
  }

  closeBox() {
    this.showBox = false;
  }
  
}
