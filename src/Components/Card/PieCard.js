import React from "react";
import { Box, Flex, Text, useColorModeValue, } from "@chakra-ui/react";
import Card from "./Card";
import PieChart from "../Chart/PieChart";
import UserInfo from "../template/UserInfo";
import { EtherscanLink } from "../../config";

function PieCard(props) {
    const {fundData, pieChartData,  pieChartOptions, ...rest } = props;
    const textColor = useColorModeValue("secondaryGray.900", "white");
    const cardColor = useColorModeValue("white", "navy.700");
    const pieTextcolor = useColorModeValue("secondaryGray.900", "#CBC3E3");
    const headingColor = useColorModeValue("#1B2559", "#F4F7FE");
    const cardShadow = useColorModeValue(
        "0px 18px 40px rgba(112, 144, 176, 0.12)",
        "unset"
    );
    // console.log(pieChartOptions ,pieChartData , "++++pieChartOptions")
    const parsePoolConnectors = (data) => {
        const poolConnectors = data.map((item) => item.symbol)
        return (
            <UserInfo info={`Pool tokens : ${poolConnectors}`} />
        )
    }

    return (
        <Box align='center' direction='column' w={{base:"100%",md:"40%"}} {...rest}>
            <Flex
                px={{ base: "0px", "2xl": "10px" }}
                justifyContent='space-between'
                alignItems='center'
                w='100%'
                mb='8px'>
                <Text color={headingColor} fontSize='md' fontWeight='700' mt='4px'>
                    ASSET ALLOCATION IN ETH VALUE
                </Text>
            </Flex>
            <PieChart
                h='100%'
                w='100%'
                chartData={pieChartData}
                chartOptions={pieChartOptions}
            />
            <Card
                bg={cardColor}
                flexDirection='row'
                boxShadow={cardShadow}
                w='100%'
                p='10px'
                px='10px'
                mx='auto'>
                <Flex direction={{ base: "row",sm:"row", md: "row" }} justifyContent={'center'} py='5px' me='10px'>
                    {
                        Array.isArray(fundData.balance) && fundData.balance.slice().sort(function (a, b) {
                            return Number(b.percentInETH) - Number(a.percentInETH)
                        }).map((item, key) => {
                            if (item["percentInETH"] > 0) {
                                return (
                                    <Box align='center' key={key}>
                                        <Text
                                            px={{ base: "0",sm:"10px", md: "10px" }}
                                            py={{ base: "5px", md: "0" }}
                                         
                                            display={'flex'}
                                            textTransform={'uppercase'}
                                            gap={1}
                                            fontSize='xs'
                                            color={pieTextcolor}
                                            fontWeight='700'
                                            mb='5px'>
                                            <img
                                            style={{ height: "20px", width: "20px" }}
                                            src={`https://tokens.1inch.io/${String(item["address"]).toLowerCase()}.png`}
                                            alt="logo"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://etherscan.io/images/main/empty-token.png" }} />
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
                                        </Text>

                                        <Text  fontSize={{base:"12px",md:"sm"}} color={textColor} fontWeight='700' py={{ base: "5px", md: "0" }} px={{ base: "0",sm:"10px", md: "10px" }}>
                                            {item["percentInETH"] > 0 ? Number(item["percentInETH"]).toFixed(4) : 0} %
                                        </Text>
                                    </Box>

                                )
                            }
                        })
                    }

                </Flex>
            </Card>
        </Box>
    );
}

export default PieCard;
