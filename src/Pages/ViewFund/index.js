import React, { useEffect, useRef, useState } from 'react'
import ShadowBox from '../../Components/Cards/ShadowBox';
import IconBox from '../../Components/Icons/IconBox';
import Header from '../../Components/common/Header';
import { Box, Heading, Icon, SimpleGrid, List, ListItem, Progress, Stack, useColorModeValue, GridItem, Grid, Table, Thead, Tr, Th, Td, Tbody, Text, Button, Tooltip, Center, Alert, AlertIcon, } from '@chakra-ui/react'
import { MdAttachMoney, } from "react-icons/md";
import Card from '../../Components/Card/Card';
import Footer from '../../Components/common/footer/Footer';
import getFundData from '../../utils/getFundData';
import { EtherscanLink, APIEnpoint, NeworkID } from '../../config';
import EtherscanButton from '../../Components/actions/EtherscanButton';
import { useParams } from 'react-router-dom';
import MigrateToV9 from '../../Components/actions/MigrateToV9';
import PopupMsg from '../../Components/template/PopupMsg';
import { io } from 'socket.io-client';
import axios from 'axios';
import UserInfo from '../../Components/template/UserInfo';
import Deposit from '../../Components/actions/Deposit/Deposit';
import Withdraw from '../../Components/actions/Withdraw/Withdraw';
import UserHoldings from '../../Components/actions/UserHoldings';
import { fromWeiByDecimalsInput } from '../../utils/weiByDecimals';
import TradeModal from '../../Components/actions/TradeModal/TradeModal';
import Pending from '../../Components/template/spiners/Pending';
import InvestorsAlocationChart from '../../Components/Chart/InvestorsAlocationChart';
import AssetsAlocationChart from '../../Components/Chart/AssetsAlocationChart';
import WithdrawManager from '../../Components/actions/WithdrawManager';
import WhiteList from '../../Components/actions/WhiteList';
import UpdateUSDAsset from '../../Components/actions/UpdateUSDAsset';
import { fromWei } from 'web3-utils';
import _ from 'lodash';
import Loading from '../../Components/template/spiners/Loading';
import FundModal from '../../Components/actions/FundModal';
import ManagerModal from '../../Components/actions/ManagerModal';
import { inject, observer } from 'mobx-react';
import WalletInfo from '../../Components/common/WalletInfo';
import DashboardHeader from '../../Components/common/DashboardHeader';

function ViewFund(props) {

    const { address } = useParams();
    const [smartFundAddress, setSmartFundAddress] = useState('');
    const [name, setName] = useState('');
    const [balance, setBalance] = useState(null);
    const [owner, setOwner] = useState('');
    const [profitInETH, setProfitInETH] = useState('0');
    const [profitInUSD, setProfitInUSD] = useState('0');
    const [valueInETH, setValueInETH] = useState('0');
    const [valueInUSD, setValueInUSD] = useState('0');
    const [managerTotalCut, setManagerTotalCut] = useState('0');
    const [managerRemainingCut, setManagerRemainingCut] = useState('0');
    const [pending, setPending] = useState(false);
    const [isDataLoad, setIsDataLoad] = useState(false);
    const [txName, setTxName] = useState('');
    const [txHash, setTxHash] = useState('');
    const [lastHash, setLastHash] = useState('');
    const [shares, setShares] = useState([]);
    const [version, setVersion] = useState(0);
    const [txCount, setTxCount] = useState(0);
    const [mainAsset, setMainAsset] = useState('');
    const [fundSizeType, setFundSizeType] = useState('full');
    const [managerFee, setManagerFee] = useState(0);
    const [tradeVerification, setTradeVerification] = useState(1);
    const [activeAssets, setActiveAssets] = useState('')
    const [totalAssets, setTotalAssets] = useState('');
    const [investors, setInvestors] = useState('');

    const _popupChild = useRef(null);
    const _isMounted = true;

    useEffect(() => {

        loadData();
        initSocket();
        checkPending();

        return () => {
            // _isMounted = false;
        };
    }, []);

    const initSocket = () => {
        const socket = io(APIEnpoint);
        socket.on('connect', () => {
            socket.on('Deposit', (address, hash) => {
                txUpdate('deposit', address, hash);
            });

            socket.on('Withdraw', (address, hash) => {
                txUpdate('withdraw', address, hash);
            });

            socket.on('Trade', (address, hash) => {
                txUpdate('trade', address, hash);
            });
        });
    };
    const txUpdate = (txName, address, hash) => {
        if (address === address && lastHash !== hash) {
            if (_isMounted) {
                setLastHash(hash);
                setTxName(txName);
                setTxHash(hash);
                updateBalance();
                checkPending();

                if (_popupChild.current) {
                    showPopup();
                }
            }
        }
    };

    const loadData = async () => {
        const fund = await getFundData(address);
        if (_isMounted) {
            setSmartFundAddress(fund.data.result.address);
            setName(fund.data.result.name);
            setBalance(JSON.parse(fund.data.result.balance));
            setOwner(fund.data.result.owner);
            setProfitInETH(fund.data.result.profitInETH);
            setProfitInUSD(fund.data.result.profitInUSD);
            setValueInETH(fund.data.result.valueInETH);
            setValueInUSD(fund.data.result.valueInUSD);
            setManagerTotalCut(fund.data.result.managerTotalCut);
            setManagerRemainingCut(fund.data.result.managerRemainingCut);
            setShares(fund.data.result.shares);
            setIsDataLoad(true);
            setVersion(Number(fund.data.result.version));
            setMainAsset(fund.data.result.mainAsset);
            setFundSizeType(fund.data.result.fundType);
            setManagerFee(fund.data.result.managerFee);
            setTradeVerification(fund.data.result.tradeVerification);
            setTotalAssets(
                (() => {
                    try {
                        const addresses = JSON.parse(fund.data.result.balance).map(i => i.address)
                        return addresses.length
                    } catch (e) {
                        return 0
                    }
                })()
            );
            setActiveAssets(
                (() => {
                    try {
                        const addresses = JSON.parse(fund.data.result.balance).filter(i => i.percentInETH > 0)
                        return addresses.length
                    } catch (e) {
                        return 0
                    }
                })()
            );
            setInvestors(
                (() => {
                    try {
                        const investors = JSON.parse(fund.data.result.shares).map(i => i.user)
                        return investors.length
                    } catch (e) {
                        return 0
                    }
                })()
            )

        }
    };

    const updateBalance = async () => {
        const fund = await getFundData(address);
        if (_isMounted) {
            setBalance(JSON.parse(fund.data.result.balance));
            setProfitInETH(fund.data.result.profitInETH);
            setProfitInUSD(fund.data.result.profitInUSD);
            setValueInETH(fund.data.result.valueInETH);
            setValueInUSD(fund.data.result.valueInUSD);
            setManagerTotalCut(fund.data.result.managerTotalCut);
            setManagerRemainingCut(fund.data.result.managerRemainingCut);
            setShares(fund.data.result.shares);
        };

    }

    const pendingHandler = (_bool, _txCount) => {
        setPending(_bool);
        setTxCount(_txCount);
    };

    const checkPending = async () => {
        if (props.MobXStorage.account) {
            let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + props.MobXStorage.account[0]);
            txCount = txCount.data.result;
            const isPending = Number(txCount) === 0 ? false : true
            if (_isMounted) {
                setPending(isPending);
                setTxCount(txCount);
            }
        }
    };

    const parsePoolConnectors = (data) => {
        const poolConnectors = data.map((item) => item.symbol);
        return <UserInfo info={`Pool tokens : ${poolConnectors}`} />;
    };

    const showPopup = () => {
        if (_popupChild.current) _popupChild.current.show();
    };

    const profitInEth = fromWei(String(profitInETH), 'ether')
    const profitInUsd = fromWei(String(profitInUSD), 'ether')
    const valueInEth = fromWei(String(valueInETH), 'ether')
    const valueInUsd = fromWei(String(valueInUSD), 'ether')

    const tooltipBg = useColorModeValue("black", "#A4ADC7")
    const headingColor = useColorModeValue("#1B2559", "#F4F7FE");
    const totalprogressBg = useColorModeValue("green.100", "#CBC3E3")
    const colorSchemeGreen = useColorModeValue("green", "green")
    const colorSchemeRed = useColorModeValue("red", "red")
    const remainingprogressBg = useColorModeValue("red.100", "#CBC3E3")
    const allbtnBg = useColorModeValue("#039be5", "#039be5")
    const tableHead = useColorModeValue("#1A202C", "#fff")
    const brandColor = useColorModeValue("#422AFB", "##CBC3E3");
    const boxBg = useColorModeValue("#F4F7FE", "gray.600");

    return (
        <React.Fragment>
        {
            props.MobXStorage.netId && NeworkID !== props.MobXStorage.netId
              ?
              (
                <Alert status="error" sx={{ color: "red", fontSize: "sm",fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center",textTransform:"uppercase" }}><AlertIcon color="red" />please change MetaMask to BNB network</Alert>
              )
              : null
          }
          <Box mt={2} px={2}>
            <DashboardHeader />
          </Box>
            <Box px={2}>
                <WalletInfo web3={props.MobXStorage.web3} accounts={props.MobXStorage.account} />
                <Header heading="Fund Detail" />
                <MigrateToV9
                    version={version}
                    owner={owner}
                    web3={props.MobXStorage.web3}
                    accounts={props.MobXStorage.account}
                    smartFundAddress={smartFundAddress}
                />
                {
                    isDataLoad ?
                        (
                            <>
                                <Box>
                                    <PopupMsg txName={txName} txHash={txHash} ref={_popupChild} />
                                    {pending ? (
                                        <>
                                            <Box>
                                                <Text mt={4} sx={{ fontWeight: "500", textAlign: "center", borderRadius: "5px", padding: "10px 5px", boxShadow: "1px 1px 1px 1px gray", border: "1px solid white" }}>
                                                    Pending transitions : {txCount}
                                                </Text>
                                            </Box>
                                            <Pending />
                                        </>
                                    ) : (
                                        null
                                    )
                                    }
                                </Box>

                                <Box>
                                    <Box mt={2} sx={{ padding: "10px", borderRadius: "10px", }}>
                                        <Heading textTransform={"uppercase"} fontSize={{ base: "2xl" }} color={headingColor} textAlign={'center'} p={2}>Fund Name: {name}</Heading>
                                        <SimpleGrid
                                            width="100%"
                                            columns={{ base: 1, md: 2, lg: 4, }}
                                            gap='20px'
                                            mb='20px'>
                                            <ShadowBox
                                                name='Type'
                                                value={fundSizeType}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Core asset'
                                                value={mainAsset}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Version'
                                                value={String(version)}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Manager fee'
                                                value={Number(managerFee / 100).toFixed(2) + "%"}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Total Assets'
                                                value={totalAssets}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Active Assets'
                                                value={activeAssets}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />

                                            <ShadowBox
                                                name='Investors'
                                                value={investors}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                            <ShadowBox
                                                name='Limit tokens'
                                                value={Number(tradeVerification) === 1 ? "enable" : "disabled"}
                                                shadow="1px 2px 3px 2px rgba(21,21,21,0.12)"
                                            />
                                        </SimpleGrid>
                                    </Box>
                                    <SimpleGrid
                                        pt={5}
                                        width="100%"
                                        columns={{ base: 1, md: 2, lg: 4, }}
                                        gap='20px'
                                        mb='20px'>
                                        <ShadowBox
                                            startContent={
                                                <IconBox
                                                    w='56px'
                                                    h='56px'
                                                    bg={boxBg}
                                                    icon={
                                                        <Icon w='32px' h='32px' as={MdAttachMoney} color={brandColor} />
                                                    }
                                                />
                                            }
                                            name='Fund profit in BNB'
                                            value={profitInEth}
                                        />
                                        <ShadowBox
                                            startContent={
                                                <IconBox
                                                    w='56px'
                                                    h='56px'
                                                    bg={boxBg}
                                                    icon={
                                                        <Icon w='32px' h='32px' as={MdAttachMoney} color={brandColor} />
                                                    }
                                                />
                                            }
                                            name='Fund profit in USD'
                                            value={profitInUsd}
                                        />
                                        <ShadowBox
                                            startContent={
                                                <IconBox
                                                    w='56px'
                                                    h='56px'
                                                    bg={boxBg}
                                                    icon={<Icon w='28px' h='28px' as={MdAttachMoney} color={brandColor} />}
                                                />
                                            }
                                            name='Fund value in BNB'
                                            value={valueInEth}
                                        />
                                        <ShadowBox
                                            startContent={
                                                <IconBox
                                                    w='56px'
                                                    h='56px'
                                                    bg={boxBg}
                                                    icon={<Icon w='28px' h='28px' as={MdAttachMoney} color={brandColor} />}
                                                />
                                            }
                                            name='Fund value in USD'
                                            value={valueInUsd}
                                        />
                                    </SimpleGrid>
                                    <Box>
                                        <Heading fontSize={{ base: "xl", md: "2xl" }} sx={{ textAlign: "center", textTransform: "uppercase", color: { headingColor }, padding: "10px 0px" }}>Investor actions</Heading>
                                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                                            <Box justifyContent="center" gap={5} sx={{ display: "flex", flexDirection: { base: "column", sm: "column", md: "row" }, width: { base: "100%", md: "70%", lg: "70%" } }}>
                                                <Deposit
                                                    web3={props.MobXStorage.web3}
                                                    accounts={props.MobXStorage.account}
                                                    address={smartFundAddress}
                                                    mainAsset={mainAsset}
                                                    pending={pendingHandler}
                                                    version={version}
                                                />
                                                <Withdraw
                                                    web3={props.MobXStorage.web3}
                                                    accounts={props.MobXStorage.account}
                                                    address={smartFundAddress}
                                                    version={version}
                                                    mainAsset={mainAsset}
                                                    pending={pendingHandler}
                                                />
                                                <UserHoldings
                                                    web3={props.MobXStorage.web3}
                                                    accounts={props.MobXStorage.account}
                                                    address={smartFundAddress}
                                                    pending={pendingHandler}
                                                />
                                                <EtherscanButton address={smartFundAddress} web3={props.MobXStorage.web3} />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box mt={5} borderRadius="20px">
                                        <SimpleGrid gap={2} columns={{ base: 1, md: 2 }} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>

                                            {
                                                shares ? (
                                                    <GridItem>
                                                        <InvestorsAlocationChart Data={shares} />
                                                    </GridItem>
                                                ) : null
                                            }
                                            {
                                                NeworkID === 56 && !_.isEmpty(balance) ?
                                                    (
                                                        <GridItem>
                                                            <AssetsAlocationChart AssetsData={balance} version={version} />
                                                        </GridItem>
                                                    ) : null
                                            }

                                        </SimpleGrid>

                                    </Box>
                                    <Box>
                                        <Box mt={5} gap={4} width={"100%"} sx={{ display: "flex", flexDirection: { base: "column", md: "row" }, }} >
                                            <Card width={{ base: "100%", md: "30%" }} bg={"rgba(128, 144, 255,.1)"}>
                                                <Heading fontSize={{ base: "xl", md: "2xl" }} sx={{ textAlign: "center", textTransform: "uppercase", color: { headingColor }, padding: "10px 0px" }}>MANAGER INFO</Heading>
                                                <List p={5} width={{ base: "100%", md: "100%" }} textAlign={'center'} borderRadius={"10px"}>
                                                    <ListItem py={4}>
                                                        <span style={{ color: { headingColor }, fontWeight: "600" }}> Total Cut: {fromWei(managerTotalCut, 'ether')}</span>
                                                        <Stack spacing={5}>
                                                            <Progress bg={totalprogressBg} colorScheme={colorSchemeGreen} size='md' value={fromWei(managerTotalCut, 'ether')} sx={{ borderRadius: "20px" }} />
                                                        </Stack>
                                                    </ListItem>
                                                    <ListItem py={4}>
                                                        <span style={{ color: { headingColor }, fontWeight: "600" }}> Remaining Cut: {fromWei(managerRemainingCut, 'ether')}</span>
                                                        <Stack spacing={5} >
                                                            <Progress bg={remainingprogressBg} colorScheme={colorSchemeRed} size='md' value={fromWei(managerRemainingCut, 'ether')} sx={{ borderRadius: "20px" }} />
                                                        </Stack>
                                                    </ListItem>
                                                </List>
                                            </Card>

                                            <Card width={{ base: "100%", md: "70%" }} >
                                                <Box sx={{ display: "flex", flexDirection: { base: "column", md: "row" } }}>
                                                    <Box className='table-box' width="100%">
                                                        <Heading fontSize="xl" color={tableHead}>Fund balance</Heading>
                                                        <Table striped bordered hover style={{
                                                            textAlign: "left"
                                                        }}>

                                                            <Thead style={{ "color": "grey" }}>
                                                                <Tr>
                                                                    <Th>Token</Th>
                                                                    <Th>% from fund</Th>
                                                                    <Th>Value in BNB</Th>
                                                                    <Th>Balance</Th>
                                                                </Tr>
                                                            </Thead>
                                                            {
                                                                balance ?
                                                                    (
                                                                        <Tbody style={{ "color": "grey" }} >
                                                                            {
                                                                                Array.isArray(balance) && balance.slice().sort(function (a, b) {
                                                                                    return Number(b.percentInETH) - Number(a.percentInETH)
                                                                                }).map((item, key) => {
                                                                                    if (item["percentInETH"] > 0) {
                                                                                        return (
                                                                                            <Tr key={key}>
                                                                                                <Td className='table-row' textAlign="left">
                                                                                                    {
                                                                                                        <img
                                                                                                            style={{ height: "20px", width: "20px" }}
                                                                                                            src={`https://tokens.1inch.io/${String(item["address"]).toLowerCase()}.png`}
                                                                                                            alt="logo"
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
                                                                        <Text>No assets in this fund</Text>
                                                                    )
                                                            }
                                                        </Table>
                                                    </Box>
                                                </Box>
                                            </Card>
                                        </Box>
                                    </Box>
                                    <Box pt={5}>
                                        <Heading fontSize={{ base: "xl", md: "2xl" }} sx={{ textAlign: "center", textTransform: "uppercase", color: { headingColor }, padding: "10px 0px" }}>Manager actions</Heading>
                                        {
                                            props.MobXStorage.web3 && props.MobXStorage.account[0] === owner ?
                                                (
                                                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                        <Box justifyContent="center" gap={5} sx={{ display: "flex", flexDirection: { base: "column", sm: "column", md: "row" }, width: { base: "100%", md: "70%", lg: "70%" } }}>
                                                            <TradeModal
                                                                web3={props.MobXStorage.web3}
                                                                accounts={props.MobXStorage.account}
                                                                smartFundAddress={smartFundAddress}
                                                                pending={pendingHandler}
                                                                version={version}
                                                            />
                                                            <WithdrawManager
                                                                web3={props.MobXStorage.web3}
                                                                accounts={props.MobXStorage.account}
                                                                smartFundAddress={smartFundAddress}
                                                                owner={owner}
                                                                pending={pendingHandler}
                                                                version={version}
                                                            />
                                                            <WhiteList
                                                                web3={props.MobXStorage.web3}
                                                                accounts={props.MobXStorage.account}
                                                                smartFundAddress={smartFundAddress}
                                                                owner={owner}
                                                            />
                                                            {
                                                                mainAsset === 'USD' ?
                                                                    (
                                                                        <UpdateUSDAsset
                                                                            web3={props.MobXStorage.web3}
                                                                            accounts={props.MobXStorage.account}
                                                                            smartFundAddress={smartFundAddress}
                                                                            version={version}
                                                                        />
                                                                    ) : null
                                                            }
                                                        </Box>
                                                    </Box>
                                                ) :
                                                (
                                                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                                                        <Box justifyContent="center" gap={5} sx={{ display: "flex", flexDirection: { base: "column", sm: "column", md: "row" }, width: { base: "100%", md: "70%", lg: "70%" } }}>
                                                            <Tooltip hasArrow label={props.MobXStorage.web3 ? "You can't use this button because You are not owner of this smart fund" : "Please connect to web3"} bg={tooltipBg}>
                                                                <Button flexGrow="1" minWidth={{ base: '100%', sm: 'auto' }} bg={allbtnBg} color="#fff" sx={{ _hover: { backgroundColor: "#027CB8" } }}>
                                                                    Exchange
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip hasArrow label={props.MobXStorage.web3 ? "You can't use this button because You are not owner of this smart fund" : "Please connect to web3"} bg={tooltipBg}>
                                                                <Button flexGrow="1" minWidth={{ base: '100%', sm: 'auto' }} bg={allbtnBg} color="#fff" sx={{ _hover: { backgroundColor: "#027CB8" } }}>
                                                                    Take Cut
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip hasArrow label={props.MobXStorage.web3 ? "You can't use this button because You are not owner of this smart fund" : "Please connect to web3"} bg={tooltipBg}>
                                                                <Button flexGrow="1" minWidth={{ base: '100%', sm: 'auto' }} bg={allbtnBg} color="#fff" sx={{ _hover: { backgroundColor: "#027CB8" } }}>
                                                                    White List
                                                                </Button>
                                                            </Tooltip>
                                                            {
                                                                mainAsset === "USD" ?
                                                                    (
                                                                        <Tooltip hasArrow label={props.MobXStorage.web3 ? "You can't use this button because You are not owner of this smart fund" : "Please connect to web3"} bg={tooltipBg}>
                                                                            <Button flexGrow="1" minWidth={{ base: '100%', sm: 'auto' }} bg={allbtnBg} color="#fff" sx={{ _hover: { backgroundColor: "#027CB8" } }}>
                                                                                Stable Tokens
                                                                            </Button>
                                                                        </Tooltip>
                                                                    ) : null
                                                            }
                                                        </Box>
                                                    </Box>
                                                )
                                        }
                                    </Box>
                                    <Box>
                                        <SimpleGrid mt={5} gap={5} columns={{ base: 1, md: 2 }}>
                                            <Card textAlign="center">
                                                <FundModal smartFundAddress={smartFundAddress} MobXStorage={props.MobXStorage} />
                                            </Card>
                                            <Card textAlign="center">
                                                <ManagerModal owner={owner} MobXStorage={props.MobXStorage} />
                                            </Card>
                                        </SimpleGrid>
                                    </Box>
                                    <Footer />
                                </Box>
                            </>
                        ) : (
                            <Loading />
                        )
                }
            </Box>
        </React.Fragment>
    )
}

export default inject('MobXStorage')(observer(ViewFund));
