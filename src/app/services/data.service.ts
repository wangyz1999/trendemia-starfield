import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  getCompressedData(filepath: string) {
    // Fetch the Brotli compressed file
    return this.http.get(filepath, { responseType: 'arraybuffer' });
  }

  // getCompressedData(url: string): Observable<any> {
  //   return this.http.get(url);
  // }
}
