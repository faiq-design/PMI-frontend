import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import * as moment from 'moment';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { Config } from 'src/assets/config';
import { DashboardService } from '../../dashboard.service';
import { ExcelService } from '../../excel.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-attendance-detail',
  templateUrl: './attendance-detail.component.html',
  styleUrls: ['./attendance-detail.component.scss']
})
export class AttendanceDetailComponent implements OnInit {
  ip: any = Config.BASE_URI;
  tableData: any = [];
  obj: any = {};
  loading = false;
  loadingData: boolean;
  startDate = new Date();
  endDate = new Date();
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();
  // @Input() startDate: moment.MomentInput;
  title = 'Attendance';
  titleNew = 'Supervisor Attendance';
  userId: any;
  @ViewChild('childModal', { static: true }) childModal: ModalDirective;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  selectedItem: any = {};
  p = 0;
  tableTitle = '';
  params: any = {};
  labels: any;
  selectedSurveyor: any;
  surveyorList: any;
  typeId: any;

  constructor(
    private httpService: DashboardService,
    private toastr: ToastrService,
    private excelService: ExcelService,
    public router: Router
  ) {}

  ngOnInit() {
    if (this.router.url === '/dashboard/admin/attendance-detail') {
      this.typeId = 1;
    } else if (this.router.url === '/dashboard/admin/attendance-detail-supervisor') {
      this.typeId = 2;
    }
    this.getSisSurveyor();
    this.getData();
  }

  getSisSurveyor() {
    // debugger;
    this.loadingData = true;
    const obj = {
      regionId: -1,
      typeId: this.typeId
    };
    this.httpService.getSisSurveyor(obj).subscribe(
      (data: any) => {
        this.surveyorList = data;
        this.loadingData = false;
      },
      (error) => {
        this.toastr.error(error.message, 'Error');
        this.loadingData = false;
      }
    );
  }

  getData() {
    // debugger;
    this.loading = true;

    this.obj = {
      startDate: moment(this.startDate).format('YYYY-MM-DD'),
      endDate: moment(this.endDate).format('YYYY-MM-DD'),
      surveyorId: this.selectedSurveyor ? this.selectedSurveyor : -1,
      typeId: this.typeId
    };

    this.httpService.getSisAttendanceList(this.obj).subscribe(
      (data) => {
        // // console.log(data);
        this.tableData = data;
        if (this.tableData.length === 0) {
          this.loading = false;
          this.toastr.info('No record found.');
        }
        this.setImageUrl();
        this.loading = false;
      },
      (error) => {}
    );
    // console.log(this.tableData);
    // debugger;
  }

  showChildModal(): void {
    this.childModal.show();
  }
  hideChildModal(): void {
    this.childModal.hide();
  }

  setSelectedItem(item) {
    this.selectedItem = item;
  }

  resetFilter() {
    this.selectedSurveyor = -1;
    this.startDate = new Date();
    this.endDate = new Date();
  }

  setImageUrl() {
    // debugger;
    for (const data of this.tableData) {
      const imgUrl = data.image_url;
      if (imgUrl.indexOf(Config.WASABI_IMAGE_STRING) >= 0) {
        const i = this.tableData.findIndex((e) => e.id == data.id);
        this.tableData[i].isExternalUrl = true;
      }
    }
  }
}
