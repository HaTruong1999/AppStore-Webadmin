import { Component, OnInit, ViewChild } from '@angular/core';
import { Cache } from '~/app/core/lib/cache';
import { AuthService } from '~/app/core/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ITEMS_PER_PAGE, ITEMS_PAGESIZE } from "~/app/core/config/pagination.constants";
import { WorkplacesService } from '~/app/core/services/manager/workplaces.service';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { NzModalService } from 'ng-zorro-antd/modal';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

@Component({
  selector: 'workplaces-list',
  templateUrl: './workplaces.component.html',
  styleUrls: ['./workplaces.component.scss']
})
export class WorkplacesComponent implements OnInit {

  title: string;
  subTitle: string;
  modalType: string;

  isPageLoading: boolean = true;
  currentPage: number = 1;
  pageSizes: number[] = ITEMS_PAGESIZE;
  currentPageSize = ITEMS_PER_PAGE;
  total = 0;
  listData = [];
  isLoadingTable = true;

  dataCustomer = [];
  custId = null;
  isLoadingButton: boolean = false;
  searchValue: string = '';
  isAdd: boolean = true;
  sort = '';

  constructor(
    public authService: AuthService,
    public toast: ToastrService,
    public workplacesService: WorkplacesService,
    public translate: TranslateService,
    private modal: NzModalService,
  ) {
    //this.authService.checkMenu('users');
    //this.authService.checkToken();
  }
  ngOnInit() {
    this.isPageLoading = false;
    this.onSearch();
  }

  onSearch() {
    //this.searchValue = this.search;
    this.getData();
  }

  getData() {
    this.isLoadingButton = true;
    this.isLoadingTable = true;
    this.workplacesService.Workplaces(this.currentPage, this.currentPageSize, this.searchValue, this.custId, this.sort)
      .subscribe((res: any) => {
        this.isLoadingButton = false;
        this.isLoadingTable = false;

        this.listData = res.items;
        this.total = res.meta.totalItems;

        // if(res.code == 1)
        // {
        //   this.listData = res.data.items;
        //   this.total = res.data.meta.totalItems;
        // }
        // else
        // {
        //   this.toast.error(this.translate.instant('global_fail'));
        // }
      }, error => {
        this.isLoadingButton = false;
        this.isLoadingTable = false;
        console.log(error)
        this.toast.error(this.translate.instant('global_error_fail'));
      });
  }
  reloadData() {
    this.searchValue = '';
    this.searchChange();
  }

  searchChange() {
    this.currentPage = 1;
    this.onSearch();
  }

  customerChange() {
    this.searchChange();
  }

  //Cập nhật
  edit(userId: string) {
    this.isAdd = false;
    //this.createModal.open(userId);
  }

  //Xóa
  delete(userId: string) {
    this.modal.confirm({
      nzTitle: this.translate.instant('global_confirm_delete_title'),
      nzOkText: this.translate.instant('global_submit'),
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.submitDelete(userId),
      nzCancelText: this.translate.instant('global_cancel'),
    });
  }
  submitDelete(userId: string) {
    this.workplacesService.Delete(userId)
      .subscribe((res: any) => {
        this.toast.success(this.translate.instant('global_delete_success'));
        this.reloadData();
        // if(res.code == 1)
        // {
        //   this.toast.success(this.translate.instant('global_delete_success'));
        //   this.reloadData();
        // }
        // else
        // {
        //   this.toast.warning(this.translate.instant('global_delete_fail'));
        // }
      }, error => {
        console.log(error)
        this.toast.error(this.translate.instant('global_error_fail'));
      });
  }

  //Thêm mới
  openCreateModal() {
    this.isAdd = true;
    //this.createModal.open();
  }
  submitCreate($event) {
    if ($event) {
      if (this.isAdd)
        this.reloadData();
      else
        this.getData();
    }
  }

  //Thêm mới
  openImportModal() {
    this.isAdd = true;
    //this.importModal.open();
  }

  submitImport($event) {
    if ($event) {
      if (this.isAdd)
        this.reloadData();
      else
        this.getData();
    }
  }

  //Thay đổi số bản ghi
  onPageSizeChange(pageSize) {
    this.currentPage = 1;
    this.currentPageSize = pageSize;
    this.onSearch();
  }

  //Thay đổi trang
  onPageChange(pageIndex) {
    this.currentPage = pageIndex;
    this.onSearch();
  }

  changeQueryParam($event) {
    let listSort = [];
    if ($event != null) {
      if ($event.sort != null) {
        $event.sort.forEach(sort => {
          if (sort.value != null)
            listSort.push(sort);
        });
      }
    }
    if (listSort.length > 0) {
      let count = 0;
      let str = '{';
      listSort.forEach(item => {
        count++;
        str += '"' + item.key + '":' + (item.value == 'ascend' ? '"ASC"' : '"DESC"') + (count == listSort.length ? '' : ',');
      });
      str += '}';
      this.sort = str;
    }
    else {
      this.sort = '';
    }
    this.getData();
  }

  exportExcel() {

    let jsonData = [];
    this.listData.forEach(item => {
      const { custId, userId, userCreatedby, userCreateddate, userSocketid, userUpdatedby, userUpdateddate, userAvatar, ...result } = item;
      jsonData.push(result);
    });

    let fileName = "Export" + (new Date()).getTime();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonData);
    const wb: XLSX.WorkBook = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.saveExcelFile(excelBuffer, fileName);
  }

  saveExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, fileName + '.xlsx');
  }

}
