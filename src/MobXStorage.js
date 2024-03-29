import { makeObservable, observable,action } from "mobx";
import isMobile from './utils/isMobile'
import { fromWei, toNumber } from 'web3-utils'
import BigNumber from 'bignumber.js'

 class MOBXStorage {
  web3 = null
  account = null
  netId = null
  SmartFunds = []
  SmartFundsOriginal = []
  SmartFundsCurrentPage = []
  FilterActive = false
  FilterInfo = ''
  TotalValue = 0
  TotalProfit = 0
  HistoryTotalProfit = 0
  userTotalValue = 0
  userTotalProfit = 0
  userHistoryTotalProfit = 0
  filterOptions = null


  constructor() {
    makeObservable(this, {
      web3: observable,
      account: observable,
      netId: observable,
      SmartFunds: observable,
      SmartFundsOriginal: observable,
      FilterInfo: observable,
      FilterActive: observable,
      initSFList: action,
      initWeb3AndAccounts: action,
      paginationChange: action,
      myInvestments: action,
      myFunds: action,
      // updateSmartFundsList: action
    })
  }
  // Initializers
  initWeb3AndAccounts(_web3, _accounts, _netId) {
    this.web3 = _web3
    this.account = _accounts
    this.netId = _netId
  }

  initSFList(_newList) {
    const initPageNumber = (isMobile()) ? 5 : 10

    this.SmartFundsOriginal = this.sortSFByValue(_newList)
    this.SmartFundsCurrentPage = this.sortSFByValue(_newList).slice(0, initPageNumber)
    this.SmartFunds = this.sortSFByValue(_newList).slice(0, initPageNumber)

    const { totalValue, totalProfit, historyTotalProfit } = this.calculateValueAndProfit(this.SmartFundsOriginal)
    console.log("SmartFundsSmartFunds")
    this.TotalValue = totalValue
    this.TotalProfit = totalProfit
    this.HistoryTotalProfit = historyTotalProfit
  }

  // Update fund list with custom data
  updateSmartFundsListByFilter(smartFunds, filterOptions, filterKeys) {
    const keys = filterKeys.join(',')
    this.FilterActive = true
    this.FilterInfo = `Filter funds by ${keys}`
    this.SmartFunds = smartFunds
    this.filterOptions = filterOptions
  }

  // Filters
  sortSFByValue(smartFunds) {
    const sorted = smartFunds.slice().sort(function (a, b) {
      return a.valueInETH - b.valueInETH;
    })
    return sorted.reverse()
  }

  sortFundsByHigherROI() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) =>
      Number(fromWei(String(s.profitInETH), 'ether') / fromWei(String(s.valueInETH), 'ether')) -
      Number(fromWei(String(f.profitInETH), 'ether') / fromWei(String(f.valueInETH), 'ether'))
    )
  }

  sortFundsByLowerROI() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) =>
      Number(fromWei(String(f.profitInETH), 'ether') / fromWei(String(f.valueInETH), 'ether')) -
      Number(fromWei(String(s.profitInETH), 'ether') / fromWei(String(s.valueInETH), 'ether'))
    )
  }

  sortFundsByHigherProfit() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) => s.profitInETH - f.profitInETH)
  }

  sortFundsByLowerProfit() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) => f.profitInETH - s.profitInETH)
  }

  sortFundsByHigherValue() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) => s.valueInETH - f.valueInETH)
  }

  sortFundsByLowerValue() {
    this.SmartFunds = this.SmartFundsOriginal.sort((f, s) => f.valueInETH - s.valueInETH)
  }

  myFunds(owner) {
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.owner && fund.owner.toLowerCase().includes(owner.toLowerCase()));
    this.FilterActive = true;
    this.FilterInfo = "Filter funds by owner: " + owner.slice(0, -35) + "...";

    const { totalValue, totalProfit, historyTotalProfit } = this.calculateValueAndProfit(this.SmartFunds);
    this.userTotalValue = totalValue;
    this.userTotalProfit = totalProfit;
    this.userHistoryTotalProfit = historyTotalProfit;
  }

  myInvestments(address) {
    this.SmartFunds = this.SmartFundsOriginal.filter(fund => fund.shares && fund.shares.includes(address));
    this.FilterActive = true;
    this.FilterInfo = "Filter funds by investor: " + address.slice(0, -35) + "...";

    const { totalValue, totalProfit, historyTotalProfit } = this.calculateValueAndProfit(this.SmartFunds);
    this.userTotalValue = totalValue;
    this.userTotalProfit = totalProfit;
    this.userHistoryTotalProfit = historyTotalProfit;
  }


  // reset filters
  AllFunds() {
    this.SmartFunds = this.SmartFundsCurrentPage
    this.FilterActive = false
    this.FilterInfo = ""
    this.filterOptions = null
  }

  // pagination
  paginationChange(_smartFunds) {
    this.SmartFunds = _smartFunds
    this.SmartFundsCurrentPage = _smartFunds
  }

  // internal helper
  calculateValueAndProfit(SmartFunds) {
    // console.log("SmartFundsSmartFunds",SmartFunds)
    if (SmartFunds.length > 0) {
      const reducer = (accumulator, currentValue) => BigNumber(accumulator).plus(currentValue)
      // get value
      const value = SmartFunds.map(fund => Number(fromWei(fund.valueInUSD, 'ether')))
      const totalValue = Number(value.reduce(reducer)).toFixed(2)

      // get profit
      const profit = SmartFunds.map((fund) => {
        if (fund.profitInUSD > 0) {
          try {
            return fromWei(toNumber(new BigNumber(fund.profitInUSD)), 'ether')
          } catch (e) {
            console.log("Error, can't convert fund.profitInUSD error ", e)
            return 0
          }
        } else {
          return 0
        }
      })
      const totalProfit = Number(profit.reduce(reducer)).toFixed(2)

      // get history profit
      const historyProfit = SmartFunds.map((fund) => {
        if (fund.historyProfitInUSD > 0) {
          try {
            return fromWei(String(fund.historyProfitInUSD), 'ether')
          } catch (e) {
            console.log("Error, can't convert fund.historyProfitInUSD error ", e)
            return 0
          }
        } else {
          return 0
        }
      })

      const historyTotalProfit = Number(historyProfit.reduce(reducer)).toFixed(2)

      return { totalValue, totalProfit, historyTotalProfit }
    }
    else {
      return { totalValue: 0, totalProfit: 0, historyTotalProfit: 0 }
    }
  }
}


// decorate(MOBXStorage, {
//     web3: observable,
//     account: observable,
//     netId: observable,
//     SmartFunds: observable,
//     SmartFundsOriginal: observable,
//     FilterInfo: observable,
//     FilterActive:observable,
//     initSFList: action,
//     initWeb3AndAccounts:action,
//     paginationChange: action,
//     myInvestments:action,
//     myFunds: action,
//     updateSmartFundsList:action
// })

const MobXStorage = new MOBXStorage()

export default MobXStorage;
