import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AvailableItems } from 'src/app/models/candy-list';
import { ProductService } from 'src/app/product/product.service';
import { CommonModule } from '@angular/common';
import { ImageService } from 'src/app/Images/image.service';

@Component({
  selector: 'app-available-items-list-table',
  templateUrl: './available-items-list.component.html',
  
  styleUrl: '../mat-table-responsive.css'
})
export class AvailableItemsListTableComponent implements AfterViewInit{

  dataSourceAvailableItems = new MatTableDataSource<AvailableItems>();
  @ViewChild('paginatorAvailableItems') paginatorAvailableItems!: MatPaginator;
  displayedColumnsAvailableItems: string[] = ['productId', 'itemsRemaining', 'lastUpdated'];


  ngAfterViewInit() {

    this.loadTableData();
  }
onImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = this.imageService.fallbackImage; // or leave blank

  console.log(`onImageError Callback Image:  ${this.imageService.fallbackImage}`)

}
  loadTableData(){
        this.productService.getAvailableItems().subscribe(availableItemsResponse => {
      const rawAvailableItems = Array.isArray(availableItemsResponse)
        ? availableItemsResponse
        : (availableItemsResponse && typeof availableItemsResponse === 'object' && 'data' in availableItemsResponse && Array.isArray((availableItemsResponse as any).data))
          ? (availableItemsResponse as any).data
          : [];

      const flatAvailableItems = Array.isArray(rawAvailableItems[0]) ? rawAvailableItems[0] : rawAvailableItems;

      this.dataSourceAvailableItems.data = flatAvailableItems;
      console.log("Assigned AvailableItemsListTableComponent :", JSON.stringify(flatAvailableItems));
      this.dataSourceAvailableItems.paginator = this.paginatorAvailableItems;
    });
  }
  constructor(private productService: ProductService,
    public imageService:ImageService
  ){


    

  }



  isOutOfStock(row: AvailableItems): string {
    
    if(row.itemsRemaining > 150){
      return "full"
    }else if(row.itemsRemaining >= 100 && row.itemsRemaining <= 150 ){
      return "middle";

    }else if(row.itemsRemaining < 100 && row.itemsRemaining >= 0 ){

      return "low";

    }else{
      return "invalid";
    }
    
  }

}
