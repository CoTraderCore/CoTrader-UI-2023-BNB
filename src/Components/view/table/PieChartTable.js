import React from 'react'
import { Box, Table, Thead, Tbody, Tr, Td, Th, Flex, Text, useColorModeValue } from '@chakra-ui/react'
import UserInfo from '../../template/UserInfo';
import { EtherscanLink } from '../../../config';
import { fromWeiByDecimalsInput } from '../../../utils/weiByDecimals';

function PieChartTable({fundData}) {
  const headingColor = useColorModeValue("#1B2559", "#F4F7FE");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const headerColor = useColorModeValue("#1B2559", "#CBC3E3");

  const parsePoolConnectors = (data) => {
    const poolConnectors = data.map((item) => item.symbol)
    return (
      <UserInfo info={`Pool tokens : ${poolConnectors}`} />
    )
  }
  return (
    <Box 
    className='table-box'
    direction='column'
      w={{base:"100%",md:"60%"}}
      px='0px'>
      <Flex px='25px' justify='space-between' align='center'>
        <Text
          color={headingColor}
          fontSize='22px'
          fontWeight='700'
          lineHeight='100%'>
          FUND VALANCE
        </Text>
      </Flex>
      <Table style={{ textAlign: "left", width: "100%" }}>
        <Thead style={{ color: "grey" }}>
          <Tr >
            <Th color={headerColor}>Token</Th>
            <Th color={headerColor} >% from fund</Th>
            <Th color={headerColor}>Value in BNB</Th>
            <Th color={headerColor}>Balance</Th>
          </Tr>
        </Thead>
        {
          fundData.balance.length > 0 ?
            (
              <Tbody style={{ color: "grey",}} fontSize={{base:"12px",sm:"14px",md:"auto"}} >
                {
                  Array.isArray(fundData.balance) && fundData.balance.slice().sort(function (a, b) {
                    return Number(b.percentInETH) - Number(a.percentInETH)
                  }).map((item, key) => {
                    if (item["percentInETH"] > 0) {
                      return (
                        <Tr key={key}>
                          <Td className='table-row' sx={{textTransform:"uppercase",flexDirection:{base:"column",sm:"column",md:"row"}, color: { textColor }, fontWeight: "500" }}>
                            {
                              <img
                                style={{ height: "20px", width: "20px",}}
                                src={`https://tokens.1inch.io/${String(item["address"]).toLowerCase()}.png`}
                                alt="Logo"
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://etherscan.io/images/main/empty-token.png" }} />
                            }
                            &nbsp;
                            {<a href={EtherscanLink + "token/" + item["address"]} target="_blank" rel="noopener noreferrer">{item["symbol"]}</a>}
                            &nbsp;
                            {
                              item["tokensAdditionalData"].length > 0
                                ?
                                (
                                  <>
                                    {parsePoolConnectors(item["tokensAdditionalData"])}
                                  </>
                                ) : null
                            }
                          </Td>

                          <Td>
                            {item["percentInETH"] > 0 ? Number(item["percentInETH"]).toFixed(4) : 0} %
                          </Td>

                          <Td>
                            {item["assetValueInETHFromWei"] > 0 ? Number(item["assetValueInETHFromWei"]).toFixed(6) : 0}
                          </Td>

                          <Td>
                            {Number(fromWeiByDecimalsInput(item["decimals"], item["balance"].toString())).toFixed(4)}
                          </Td>
                        </Tr>
                      )
                    }
                    else {
                      return null
                    }
                  }
                  )
                }
              </Tbody>
            )
            :
            (
              <p>No assets in this fund</p>
            )
        }
      </Table>
    </Box>

  )

}

export default PieChartTable;
