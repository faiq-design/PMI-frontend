import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Config } from '../../../../assets/config';
import { DashboardService } from '../dashboard.service';
import { NgModel } from '@angular/forms';

@Component({
  selector: 'app-row-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.scss']
})
export class RawDataComponent implements OnInit {
  ip = Config.BASE_URI;
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();
  startDate = new Date();
  endDate = new Date();
  queryList: any = [];
  selectedQuery: any = {};
  loadingData: boolean;
  loadingReportMessage = false;
  p: any = {};
  reportId = -1;
  title = '';
  selectedReportUrl = '';
  clusterList: any = [];
  zones: any = [];
  regions: any = [];
  selectedZone: any = [];
  selectedRegion: any = [];
  selectedZones: any = [];
  selectedRegions: any = {};
  selectedCluster: any = {};
  clusterId: any;
  isAdmin = false;
  monthList = Config.MONTH_LIST;
  yearList = Config.YEAR_LIST;
  selectedMonthName: any;
  selectedYear: any;

  zonePlaceholder = '';
  regionPlaceholder = '';
  clusterPlaceHolder = '';
  projectType: any;
  queryParams: any = [];
  regionList: any = [];
  selectedTown: any = [];
  selectedTowns = [];
  cities = [];

  constructor(
    private activatedRoutes: ActivatedRoute,
    private httpService: DashboardService,
    public router: Router,
    private toastr: ToastrService
  ) {
    // this.clusterList = JSON.parse(localStorage.getItem("clusterList"));
    // this.zones = JSON.parse(localStorage.getItem("zoneList"));
    // this.clusterId = localStorage.getItem("clusterId") || -1;
    // this.projectType = localStorage.getItem("projectType");
    // if (this.projectType == "NFL" || this.projectType == "NFL_SO") {
    //   this.zonePlaceholder = "Region";
    //   this.regionPlaceholder = "Zone";
    // } else {
    //   this.zonePlaceholder = "Zone";
    //   this.regionPlaceholder = "Region";
    // }
    // this.clusterPlaceHolder = "Cluster";
    this.zones = JSON.parse(localStorage.getItem('zones'));

    if (parseInt(localStorage.getItem('user_zone_id')) === -1) {
      // debugger;
      this.isAdmin = true;
    } else {
      // debugger;
      this.isAdmin = false;
    }
    // if (parseInt(localStorage.getItem("regionId")) > -1) {
    //   this.selectedRegion = parseInt(localStorage.getItem("regionId"));
    //   this.onRegionChange();
    // }
  }

  ngOnInit() {
    this.activatedRoutes.params.subscribe((params) => {
      if (params.reportId) {
        this.reportId = params.reportId;
      }
      this.getQueryTypeList(this.reportId);
    });
    //this.getAllRegions();
  }
  selectAll(select: NgModel, values, dataType) {
    select.update.emit(values);
    this.filterData(dataType);
  }
  deselectAll(select: NgModel, dataType) {
    select.update.emit([]);
    this.filterData(dataType);
  }
  equals(objOne, objTwo) {
    if (typeof objOne !== 'undefined' && typeof objTwo !== 'undefined') {
      return objOne.id === objTwo.id;
    }
  }

  getQueryTypeList(reportId) {
    this.loadingData = true;
    const obj = {
      userId: localStorage.getItem('user_id')
    };
    this.httpService.getQueryTypeList(obj).subscribe(
      (data) => {
        // console.log('query list', data);
        if (data) {
          this.queryList = data;

          this.loadQuery(reportId);
        }
        this.loadingData = false;
      },
      (error) => {
        this.loadingData = false;
        error.status === 0
          ? this.toastr.error('Please check Internet Connection', 'Error')
          : this.toastr.error(error.description, 'Error');
      }
    );
  }

  getDashboardDataNew() {
    // debugger;
    const title = this.selectedQuery.title;
    if (title === 'net cash v3' && !this.validateDateRange()) {
      this.toastr.info('Please select a date range within the same month', 'Date Selection');
      return; // Prevent the rest of the code from running if the date range is invalid
    }
    if (this.endDate >= this.startDate) {
      this.loadingData = true;
      this.loadingReportMessage = true;
      // tslint:disable-next-line:triple-equals
      const obj = {
        typeId: this.selectedQuery.id,
        startDate: this.selectedQuery.date == 'Y' ? moment(this.startDate).format('YYYY-MM-DD') : null,
        endDate: this.selectedQuery.date == 'Y' ? moment(this.endDate).format('YYYY-MM-DD') : null,
        zoneId:
          this.selectedQuery.zone == 'Y'
            ? this.selectedZone?.length > 0
              ? this.joinArray(this.selectedZone)
              : localStorage.getItem('user_zone_id')
            : null,
        regionId:
          this.selectedQuery.region == 'Y'
            ? this.selectedRegion?.length > 0
              ? this.joinArray(this.selectedRegion)
              : localStorage.getItem('regionId')
            : null,
        cityId:
          this.selectedQuery.city == 'Y'
            ? this.selectedTown?.length > 0
              ? this.joinArray(this.selectedTown)
              : -1
            : null,
        userId: localStorage.getItem('user_id'),
        month: this.selectedQuery.month == 'Y' ? this.selectedMonthName : null,
        year: this.selectedQuery.year == 'Y' ? this.selectedYear : null
      };

      const url = this.ip + '/portal/report/dashboard-data';
      const body = this.httpService.UrlEncodeMaker(obj);
      this.httpService.getKeyForProductivityReport(body, url).subscribe(
        (data) => {
          // console.log(data, 'query list');
          const res: any = data;

          if (res) {
            const obj2 = {
              key: res.key,
              fileType: res.fileType
            };
            // tslint:disable-next-line:triple-equals
            const url = this.ip + '/portal/report/download-csv-report';

            this.getproductivityDownload(obj2, url);
          } else {
            this.clearLoading();

            this.toastr.info('Something went wrong,Please retry', 'Connectivity Message');
          }
        },
        (error) => {
          this.clearLoading();
        }
      );
    } else {
      this.clearLoading();
      this.toastr.info('End date must be greater than start date', 'Date Selection');
    }
  }

  getDashboardData() {
    const title = this.selectedQuery.title;
    if (title === 'net cash v3' && !this.validateDateRange()) {
      this.toastr.info('Please select a date range within the same month', 'Date Selection');
      return; // Prevent the rest of the code from running if the date range is invalid
    }
    // debugger;
    if (this.endDate >= this.startDate) {
      this.loadingData = true;
      this.loadingReportMessage = true;
      // tslint:disable-next-line:triple-equals
      const obj = {
        typeId: this.selectedQuery.id,
        startDate: moment(this.startDate).format('YYYY-MM-DD'),
        endDate: moment(this.endDate).format('YYYY-MM-DD'),
        zoneId:
          this.selectedQuery.zone == 'Y' ? (parseInt(this.selectedZone) ? parseInt(this.selectedZone) : -1) : null,
        regionId:
          this.selectedQuery.region == 'Y'
            ? parseInt(this.selectedRegion)
              ? parseInt(this.selectedRegion)
              : -1
            : null,
        cityId: this.selectedQuery.city == 'Y' ? (this.selectedTown ? this.selectedTown : -1) : null,
        userId: localStorage.getItem('user_id'),
        month: this.selectedQuery.month == 'Y' ? this.selectedMonthName : null,
        year: this.selectedQuery.year == 'Y' ? this.selectedYear : null
      };

      const url = this.ip + '/portal/report/dashboard-data';
      const body = this.httpService.UrlEncodeMaker(obj);
      this.httpService.getKeyForProductivityReport(body, url).subscribe(
        (data) => {
          // console.log(data, 'query list');
          const res: any = data;

          if (res) {
            const obj2 = {
              key: res.key,
              fileType: res.fileType
            };
            // tslint:disable-next-line:triple-equals
            const url = this.ip + '/portal/report/download-csv-report';

            this.getproductivityDownload(obj2, url);
          } else {
            this.clearLoading();

            this.toastr.info('Something went wrong,Please retry', 'Connectivity Message');
          }
        },
        (error) => {
          this.clearLoading();
        }
      );
    } else {
      this.clearLoading();
      this.toastr.info('End date must be greater than start date', 'Date Selection');
    }
  }

  arrayMaker(arr) {
    // debugger;
    const all = arr.filter((a) => a === 'all');
    const result: any = [];
    if (all[0] === 'all') {
      arr = this.selectedZone;
    }
    arr.forEach((e) => {
      result.push(e.id);
    });
    return result;
  }
  arrayMakerRegion(arr) {
    // debugger;
    const all = arr.filter((a) => a === 'all');
    const result: any = [];
    if (all[0] === 'all') {
      arr = this.selectedRegion;
    }
    if (arr.length === 0) {
      result.push(-1);
    } else {
      arr.forEach((e) => {
        result.push(e.id);
      });
    }
    return result;
  }
  arrayMakerTown(arr) {
    // debugger;
    const all = arr.filter((a) => a === 'all');
    const result: any = [];
    if (all[0] === 'all') {
      arr = this.selectedTown;
    }
    if (arr.length === 0) {
      result.push(-1);
    } else {
      arr.forEach((e) => {
        result.push(e.id);
      });
    }
    arr.forEach((e) => {
      result.push(e.id);
    });
    return result;
  }

  getproductivityDownload(obj, url) {
    this.httpService.DownloadResource(obj, url);
    setTimeout(() => {
      this.loadingData = false;
      this.loadingReportMessage = false;
      //this.httpService.updatedDownloadStatus(false);
    }, 1000);
  }

  clearLoading() {
    this.loadingData = false;
    this.loadingReportMessage = false;
  }

  getRegionsByZoneId() {
    // debugger;
    this.loadingData = true;
    this.selectedTown = undefined;
    this.cities = [];
    this.selectedRegion = undefined;
    this.regions = [];
    if (parseInt(localStorage.getItem('user_zone_id')) == -1) {
      let parsedData: any = [];
      const obj = {
        zoneId: this.selectedZone
      };
      this.httpService.getRegionsByZoneId(obj).subscribe((data) => {
        parsedData = JSON.stringify(data);
        this.regions = JSON.parse(parsedData);
        this.loadingData = false;
      });
    }
  }
  // getRegionsByZoneIds() {
  //   this.loadingData = true;
  //   this.selectedTown = undefined;
  //   this.cities = [];
  //   this.selectedRegion = undefined;
  //   this.regions = [];
  //   if (parseInt(localStorage.getItem('user_zone_id')) == -1) {
  //     let parsedData: any = [];
  //     const obj = {
  //       zoneId: this.selectedZone,
  //     };
  //     this.httpService.getRegionsByZoneIds(obj).subscribe((data) => {
  //       parsedData = JSON.stringify(data);
  //       this.regions = JSON.parse(parsedData);
  //       this.loadingData = false;
  //     });
  //   }
  // }
  getRegionsByZoneIds() {
    // debugger;
    this.loadingData = true;
    this.selectedTown = [];
    this.cities = [];
    // if (parseInt(localStorage.getItem('user_zone_id')) == -1) {
    let parsedData: any = [];
    const obj = {
      zoneId: this.arrayMaker(this.selectedZone)
    };
    this.httpService.getRegionsByZoneIds(obj).subscribe((data) => {
      parsedData = JSON.stringify(data);
      this.regions = JSON.parse(parsedData);
      this.loadingData = false;
    });
    //}
  }

  onRegionsChange() {
    // debugger;
    this.loadingData = true;
    let parsedData: any = [];
    this.selectedTown = undefined;
    this.cities = [];
    const obj = {
      regionId: this.arrayMakerRegion(this.selectedRegion)
    };
    this.httpService.getTownLists(obj).subscribe((data) => {
      parsedData = JSON.stringify(data);
      this.cities = JSON.parse(parsedData);
      this.loadingData = false;
    });
  }
  onRegionChange() {
    // debugger;
    this.loadingData = true;
    let parsedData: any = [];
    this.selectedTown = undefined;
    this.cities = [];
    const obj = {
      regionId: this.selectedRegion ? this.selectedRegion : -1
    };
    this.httpService.getTownList(obj).subscribe((data) => {
      parsedData = JSON.stringify(data);
      this.cities = JSON.parse(parsedData);
      this.loadingData = false;
    });
  }
  zoneCheck() {
    // debugger;
    const zoneId = this.selectedZone
      ? this.selectedZone == -1
        ? localStorage.getItem('zoneId')
        : this.selectedZone
      : localStorage.getItem('zoneId');
    let zoneArray: any = [];
    if (zoneId == -1 && this.selectedQuery.zone == 'Y') {
      this.zones.forEach((e) => {
        if (e.id != -1) {
          zoneArray.push(e.id);
        }
      });
      zoneArray = zoneArray.join();
      return zoneArray;
    }
    return zoneId;
  }
  regionCheck() {
    // debugger;
    const regionId = this.selectedRegion.id
      ? this.selectedRegion.id == -1
        ? localStorage.getItem('regionId')
        : this.selectedRegion.id
      : localStorage.getItem('regionId');
    let regionArray: any = [];
    if (regionId == -1 && this.selectedQuery.region == 'Y') {
      this.regions.forEach((e) => {
        if (e.id != -1) {
          regionArray.push(e.id);
        }
      });
      if (regionArray.length == 0) {
        this.regionList.forEach((e) => {
          if (e.id != -1) {
            regionArray.push(e.id);
          }
        });
      }
      regionArray = regionArray.join();
      return regionArray;
    }
    return regionId;
  }

  getAllRegions() {
    // debugger;
    this.loadingData = true;
    this.httpService.getRegionFixed().subscribe(
      (data) => {
        const res: any = data;
        if (res.regionList) {
          this.regionList = res.regionList;
        }
        if (!res.regionList) {
          this.toastr.info('No data Found For Regions', 'Info');
        }
        this.clearLoading();
      },
      (error) => {
        this.clearLoading();
        error.status === 0
          ? this.toastr.error('Please check Internet Connection', 'Error')
          : this.toastr.error(error.description, 'Error');
      }
    );
  }
  loadQuery(reportId) {
    // debugger;
    if (reportId > -1) {
      for (const element of this.queryList) {
        if (element.id == reportId) {
          this.selectedQuery = element;
          this.title = this.selectedQuery.title;
          break;
        }
      }
      this.queryList = [];
      this.queryList.push(this.selectedQuery);
    } else {
      this.title = 'Raw Data';
    }
    this.selectedQuery = this.queryList[0];
    // this.updateDateRestrictions();
  }
  filterData(dateType?: string) {
    if (dateType === 'zone') {
      this.selectedRegion = [];
      this.selectedTown = [];
      this.regions = [];
      this.cities = [];
      this.regions = JSON.parse(localStorage.getItem('regions')).filter(
        (obj) => this.selectedZone.findIndex((e) => e.id == obj.zoneId) > -1
      );
    }
    if (dateType === 'territory') {
      this.cities = [];
      this.selectedTown = [];

      this.cities = JSON.parse(localStorage.getItem('towns')).filter(
        (obj) => this.selectedRegion.findIndex((e) => e.id == obj.regionId) > -1
      );
    }
  }

  filtersData(dateType?: string) {
    if (dateType === 'zone') {
      if (this.selectedZone.length == 1) {
        this.selectedRegion = [];
        this.selectedTown = [];
        this.regions = [];
        this.cities = [];
        this.regions = JSON.parse(localStorage.getItem('regions')).filter(
          (obj) => this.selectedZone.findIndex((e) => e.id == obj.zoneId) > -1
        );
      } else {
        this.toastr.info('Please Select 1 Region only ');
      }
    }
    if (dateType === 'territory') {
      this.cities = [];
      this.selectedTown = [];

      this.cities = JSON.parse(localStorage.getItem('towns')).filter(
        (obj) => this.selectedRegion.findIndex((e) => e.id == obj.regionId) > -1
      );
    }
  }
  joinArray(arr) {
    return arr.map((s) => s.id).join(',');
  }

  validateDateRange(): boolean {
    // debugger;
    const start = moment(this.startDate);
    const end = moment(this.endDate);

    // Check if the selected dates are in the same month and year
    if (start.isSame(end, 'month') && start.isSame(end, 'year')) {
      return true; // Valid date range
    } else {
      return false; // Invalid date range (spans multiple months)
    }
  }
}
