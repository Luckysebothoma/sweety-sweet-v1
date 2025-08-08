import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
 import { ImageService } from 'src/app/Images/image.service';
import { ProductList } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { DateTimeService } from 'src/app/Services/date-time.service';
import { environment } from 'src/environments/environment';
import {ResponseUtils} from "../../Services/response-utils"

@Component({ 
  selector: 'app-product-list-table',
  templateUrl: './product-list.component.html',
  styleUrl: '../mat-table-responsive.css'
})
export class ProductListTableComponent implements AfterViewInit {
  
  @ViewChild('paginatorProductList') paginatorProductList!: MatPaginator;
  displayedColumnsProductList: string[] = ['productId', 'productName', 'productFlavor', 'productPrice', 'image_url', 'actions'];


  imgUrl = environment.expose_image;

  dataSourceProductList = new MatTableDataSource<ProductList>();

  editRow: number | null = null;
  editableRow: any = {};
  originalRow: any = {};

  constructor(private productService: ProductService, public imageService:ImageService, private dateTimeService:DateTimeService) {}

  setProductListTable(_productlist: ProductList){

  }

  ngAfterViewInit() {
          this.loadData();

  }
loadData(){
    const functionName = "ngAfterViewInit"
    this.productService.getProductList().subscribe(productlist => {

 
      ;
      this.dataSourceProductList.data.splice(0);
            console.log(`${functionName } ${this.dateTimeService.normalizeDate(Date.now())} assigned this.dataSourceProductList.data`, productlist.data)

       console.log(`${functionName } ${this.dateTimeService.normalizeDate(Date.now())} assigned this.dataSourceProductList.data`, this.dataSourceProductList.data)
      this.dataSourceProductList.paginator = this.paginatorProductList;
   
      
        this.dataSourceProductList.data = ResponseUtils.extractFirstArrayFromNested<ProductList>(productlist, 'ProductList Extract');

    // if productlist[0] is an array of ProductList
//if (Array.isArray(productlist[0])) {
//  this.dataSourceProductList.data = productlist[0];/
//}
// if it's a single ProductList object
//else if (productlist[0]) {
//  this.dataSourceProductList.data = [productlist[0]];
//}
//else {
//  this.dataSourceProductList.data = []; // fallback to empty/
//}

    });
  }
  loadTableData(){

      this.loadData();

}
  onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
  getImageUrl(relativePath: string): string {
    return `${environment.expose_image}/${relativePath}`;
  }

  startEdit(index: number, element:any): void {
    console.log("index [" + index +"] Clicked to edit: " + JSON.stringify(element))
    this.editRow = index;
this.originalRow = { ...element };
this.editableRow = { ...element };

    console.log('Editing row:', this.originalRow);
    //this.editService.storeOriginalData(this.originalRow);
  }

saveEdit(index: number, element: any): void {
  if (this.editRow !== null) {
    const updated = { ...this.editableRow };

    // 1. Replace the row at the correct index
    const tableCopy = this.dataSourceProductList.data.slice();
    tableCopy[index] = updated;

    // 2. Update dataSource and reassign paginator
    this.dataSourceProductList = new MatTableDataSource(tableCopy);
    this.dataSourceProductList.paginator = this.paginatorProductList;

    console.log('✅ Saved new data at index', index, ':', updated);
    console.log('📦 Original element before update:', element);

    console.log('✅ Saved new data at index', index, ':', updated);
    console.log('📦 Original element before update:', element);

    // Reset editing state
    this.editRow = null;
  }
}


  cancelEdit(): void {
    console.log('Edit cancelled. Reverting to:', this.originalRow);
    if (this.editRow !== null) {
      this.dataSourceProductList.data[this.editRow] = { ...this.originalRow };
      this.dataSourceProductList._updateChangeSubscription();
    }
    this.editRow = null;
  }

}
