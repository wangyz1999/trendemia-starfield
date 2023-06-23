import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import createScatterplot from 'regl-scatterplot';
import { scaleLog, scaleLinear } from 'd3-scale';
import { checkSupport, drawPoint } from './utils';

interface Category {
  id: number;
  color: string;
}

interface DataEntry {
  x: number;
  y: number;
  cite: number;
  categories: string;
  title: string;
  date: number;
  id: string;
}

interface Point {
  title: string;
  date: number;
  id: string;
  categories: string;
}

const DEFAULT_RADIUS = 0.3;
const OPACITY_BY_DENSITY_FILL = 0.3;
const POINT_SIZE_SELECTED = 11;
const POINT_OUTLINE_WIDTH = 3;
const BASE_POINT_SIZE = 1.3;
const INFO_BOX_OFFSET_Y = 20;

@Component({
  selector: 'app-embedding-scatter',
  templateUrl: './embedding-scatter.component.html',
  styleUrls: ['./embedding-scatter.component.scss']
})

export class EmbeddingScatterComponent implements AfterViewInit {
  @ViewChild('plot') plotElement!: ElementRef;
  @ViewChild('hover') hoverElement!: ElementRef;

  points: any[] = [];
  lastHoveredPointIdx: number = -1;
  metadata: any[] = [];
  colorList: string[] = [];
  showBox: boolean = false;
  selectedPoint: { title: string, date: number, id: string, categories: string } = { title: '', date: 0, id: '', categories: '' };
  hoverPoint: { title: string, date: number, id: string, categories: string } = { title: '', date: 0, id: '', categories: '' };

  public showInfoBox = false;
  public cursorPosition = { x: 0, y: 0 };
  public infoBoxPosition = { x: 0, y: 0 };

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.cursorPosition.x = event.clientX;
    this.cursorPosition.y = event.clientY;
  }


  constructor(private http: HttpClient) { }

  ngAfterViewInit() {
    this.loadData();
  }

  private loadData(): void {
    this.http.get<Record<string, Category>>('/assets/arxiv_categories.json').subscribe((categories) => {
      this.initializeColorList(categories);
      this.http.get<DataEntry[]>('/assets/arxiv_embedding_top.json').subscribe((data) => {
        this.initializePointsAndMetadata(data, categories);
        this.createChart();
      });
    });
  }

  private initializeColorList(categories: Record<string, Category>): void {
    const categoriesArray = Object.entries(categories).map(([key, value]) => [value.id, value.color] as [number, string]);
    this.colorList = categoriesArray.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  }

  private initializePointsAndMetadata(data: DataEntry[], categories: Record<string, Category>): void {
    const minCite = Math.min(...data.map(x => x.cite));
    const maxCite = Math.max(...data.map(x => x.cite));
    this.points = [];
    this.metadata = [];
    for (const entry of data) {
      const scaledCite = (entry.cite - minCite) / (maxCite - minCite);
      if (!categories[entry.categories.split(' ')[0]]) {
        continue;
      }
      const categoryColor = categories[entry.categories.split(' ')[0]].id;
      this.points.push([entry.x, entry.y, categoryColor, scaledCite]);
      this.metadata.push({ title: entry.title, date: entry.date, id: entry.id, categories: entry.categories });
    }
  }

  private createChart(): void {
    const canvas = this.plotElement.nativeElement;
    const hoverCanvas = this.hoverElement.nativeElement;
  
    const xScale = scaleLinear().domain([-1, 1]);
    const yScale = scaleLinear().domain([-1, 1]);
  
    const hoverCtx = hoverCanvas.getContext('2d');
    let selection: any[];
  
    const scatterplot = createScatterplot({
      canvas,
      xScale,
      yScale,
      opacityByDensityFill: OPACITY_BY_DENSITY_FILL,
      pointSizeSelected: POINT_SIZE_SELECTED,
      pointOutlineWidth: POINT_OUTLINE_WIDTH,
    });
  
    this.registerScatterplotHandlers(scatterplot, canvas, hoverCanvas, hoverCtx, xScale, yScale);
    this.setScatterplotOptions(scatterplot);
    scatterplot.draw(this.points);
  }

  private registerScatterplotHandlers(
    scatterplot: any,
    canvas: HTMLCanvasElement,
    hoverCanvas: HTMLCanvasElement,
    hoverCtx: CanvasRenderingContext2D,
    xScale: any,
    yScale: any,
  ): void {
    scatterplot.subscribe('select', this.selectHandler.bind(this));
    scatterplot.subscribe('deselect', this.deselectHandler.bind(this));
    scatterplot.subscribe('pointOver', this.pointoverHandler.bind(this, hoverCtx, hoverCanvas, xScale, yScale));
    scatterplot.subscribe('pointOut', this.pointoutHandler.bind(this, hoverCtx, hoverCanvas));
    scatterplot.subscribe('view', () => {
      hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    });
    this.resizeOverlay(canvas, hoverCanvas);
    window.addEventListener('resize', this.resizeOverlay.bind(this, canvas, hoverCanvas));
    checkSupport(scatterplot);
  }
  
  private setScatterplotOptions(scatterplot: any): void {
    scatterplot.set({ sizeBy: 'value', pointSize: this.getPointSizeRange(BASE_POINT_SIZE) });
    scatterplot.set({ opacityBy: 'density' });
    scatterplot.set({ colorBy: 'category', pointColor: this.colorList });
  }
  
  private getPointSizeRange(basePointSize: number): number[] {
    const pointSizeScale = scaleLog().domain([1, 10]).range([basePointSize, basePointSize * 10]);
    return Array(100).fill(0).map((x, i) => pointSizeScale(1 + (i / 99) * 9));
  }

  private selectHandler({ points: selectedPoints }: { points: any[] }): void {
    console.log('Selected:', selectedPoints);
    if (selectedPoints.length === 1) {
      const point = this.points[selectedPoints[0]];
      const metadata = this.metadata[selectedPoints[0]];
      this.selectedPoint = { title: metadata.title, date: metadata.date, id: metadata.id, categories: metadata.categories };
      console.log(`X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${point[3]}`);
    }
    this.showBox = true;
  }
  
  private deselectHandler(): void {
    console.log('Deselected');
    this.showBox = false;
  }
  
  private pointoverHandler(hoverCtx: CanvasRenderingContext2D, hoverCanvas: HTMLCanvasElement, xScale: any, yScale: any, pointId: number, event: MouseEvent): void {
    const x = this.points[pointId][0];
    const y = this.points[pointId][1];
    const category = this.points[pointId][2];
    const value = this.points[pointId][3];
  
    if (this.lastHoveredPointIdx !== pointId) {
      hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    }
  
    this.lastHoveredPointIdx = pointId;
    this.showInfoBox = true;
    this.hoverPoint = { title: this.metadata[pointId].title, date: this.metadata[pointId].date, id: this.metadata[pointId].id, categories: this.metadata[pointId].categories };
    this.infoBoxPosition = { x: this.cursorPosition.x, y: this.cursorPosition.y + INFO_BOX_OFFSET_Y };
  
    drawPoint(
      hoverCtx, 
      xScale(x) * window.devicePixelRatio, 
      yScale(y) * window.devicePixelRatio, 
      15, 
      this.colorList[category], 
      3
    );
  }
  
  private pointoutHandler(hoverCtx: CanvasRenderingContext2D, hoverCanvas: HTMLCanvasElement): void {
    hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
    this.showInfoBox = false;
  }
  
  private resizeOverlay(canvas: HTMLCanvasElement, hoverCanvas: HTMLCanvasElement): void {
    const { width, height } = canvas.getBoundingClientRect();
    hoverCanvas.width = width * window.devicePixelRatio;
    hoverCanvas.height = height * window.devicePixelRatio;
    hoverCanvas.style.width = `${width}px`;
    hoverCanvas.style.height = `${height}px`;
  }

  // private createChart(): void {

  //   const canvas = this.plotElement.nativeElement;
  //   const hoverCanvas = this.hoverElement.nativeElement;

  //   const xScale = scaleLinear().domain([-1, 1])
  //   const yScale = scaleLinear().domain([-1, 1])

  //   const hoverCtx = hoverCanvas.getContext('2d');

  //   let selection: any[];

  //   const selectHandler = ({ points: selectedPoints }: { points: any[] }) => {
  //     console.log('Selected:', selectedPoints);
  //     selection = selectedPoints;
  //     if (selection.length === 1) {
  //       const point = this.points[selection[0]];
  //       const metadata = this.metadata[selection[0]];
  //       this.selectedPoint = { title: metadata.title, date: metadata.date, id: metadata.id, categories: metadata.categories };
  //       console.log(
  //         `X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${point[3]}`
  //       );
  //     }
  //     this.showBox = true;
  //   };

  //   const deselectHandler = () => {
  //     console.log('Deselected:', selection);
  //     selection = [];
  //     this.showBox = false;
  //   };

  //   const scatterplot = createScatterplot({
  //     canvas,
  //     xScale,
  //     yScale,
  //     opacityByDensityFill: OPACITY_BY_DENSITY_FILL,
  //     pointSizeSelected: POINT_SIZE_SELECTED,
  //     pointOutlineWidth: POINT_OUTLINE_WIDTH,
  //   });

  //   const pointoverHandler = (pointId:number) => {
  //     const x = this.points[pointId][0];
  //     const y = this.points[pointId][1];
  //     const category = this.points[pointId][2];
  //     const value = this.points[pointId][3];
      
  //     if (this.lastHoveredPointIdx !== pointId) {
  //       hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  //     }

  //     this.lastHoveredPointIdx = pointId;

  //     drawPoint(hoverCtx, 
  //       xScale(x)* window.devicePixelRatio, 
  //       yScale(y)* window.devicePixelRatio, 
  //       15,
  //       this.colorList[category], 
  //       3
  //     );
  //   };

  //   const pointoutHandler = (pointId:number) => {
  //     hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  //   };

  //   const resizeOverlay = () => {
  //     const { width, height } = canvas.getBoundingClientRect();
  //     hoverCanvas.width = width * window.devicePixelRatio;
  //     hoverCanvas.height = height * window.devicePixelRatio;
  //     hoverCanvas.style.width = `${width}px`;
  //     hoverCanvas.style.height = `${height}px`;
  //   };
  //   resizeOverlay();
    
  //   window.addEventListener('resize', resizeOverlay);

  //   scatterplot.subscribe('view', ({ xScale: innerXScale, yScale: innerYScale }) => {
  //     hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);


  //   });

  

  //   checkSupport(scatterplot);

  //   scatterplot.subscribe('select', selectHandler);
  //   scatterplot.subscribe('deselect', deselectHandler);
  //   scatterplot.subscribe('pointOver', pointoverHandler);
  //   scatterplot.subscribe('pointOut', pointoutHandler);

  //   const getPointSizeRange = (basePointSize: number) => {
  //     const pointSizeScale = scaleLog()
  //       .domain([1, 10])
  //       .range([basePointSize, basePointSize * 10]);

  //     return Array(100)
  //       .fill(0)
  //       .map((x, i) => pointSizeScale(1 + (i / 99) * 9));
  //   };

  //   scatterplot.set({
  //     sizeBy: 'value',
  //     pointSize: getPointSizeRange(1.3)
  //   });

  //   scatterplot.set({
  //     opacityBy: 'density',
  //   });

  //   scatterplot.set({ colorBy: 'category', pointColor: this.colorList });
  //   scatterplot.draw(this.points);
  // }

  closeBox() {
    this.showBox = false;
  }
  
}
