//@ts-nocheck
import Layout from "layouts/Layout";
import React, { useEffect, useState } from "react";
import style from "./index.module.scss";
import cn from "classnames/bind";
import { TooltipIcon } from "components/Tooltip";
import SettingModal from "./Modals/SettingModal";
import SelectTokenModal from "./Modals/SelectTokenModal";
import { useQuery } from 'react-query'
import { fetchBalance, fetchExchangeRate, fetchPairInfo, fetchPool, fetchPoolInfoAmount, fetchTaxRate, fetchTokenInfo, generateContractMessages, simulateSwap } from "rest/api";
import { Type } from 'pages/Swap';
import CosmJs from "libs/cosmjs";
import { DECIMAL_FRACTION, ORAI } from "constants/constants";
import { parseAmount, parseDisplayAmount } from "libs/utils";
import { displayToast, TToastType } from "components/Toasts/Toast";
import { network } from "constants/networks";

const cx = cn.bind(style);

const mockPair = {
  "ORAI-AIRI": {
    contractAddress: "orai14n2lr3trew60d2cpu2xrraq5zjm8jrn8fqan8v",
    amount1: 100,
    amount2: 1000,
  },
  "AIRI-ATOM": {
    contractAddress: "orai16wvac5gxlxqtrhhcsa608zh5uh2zltuzjyhmwh",
    amount1: 100,
    amount2: 1000,
  },
  "ORAI-TEST1": {
    contractAddress: "orai14n2lr3trew60d2cpu2xrraq5zjm8jrn8fqan8v",
    amount1: 100,
    amount2: 1000,
  },
  "ORAI-TEST2": {
    contractAddress: "orai14n2lr3trew60d2cpu2xrraq5zjm8jrn8fqan8v",
    amount1: 100,
    amount2: 1000,
  },
  "AIRI-TEST1": {
    contractAddress: "orai14n2lr3trew60d2cpu2xrraq5zjm8jrn8fqan8v",
    amount1: 100,
    amount2: 1000,
  },
  "AIRI-TEST2": {
    contractAddress: "orai14n2lr3trew60d2cpu2xrraq5zjm8jrn8fqan8v",
    amount1: 100,
    amount2: 1000,
  },
};

const mockToken = {
  ORAI: {
    contractAddress: "orai",
    denom: "orai",
    logo: "oraichain.svg",
  },
  AIRI: {
    contractAddress: "orai1gwe4q8gme54wdk0gcrtsh4ykwvd7l9n3dxxas2",
    logo: "airi.svg",
  },
  ATOM: {
    contractAddress: "orai15e5250pu72f4cq6hfe0hf4rph8wjvf4hjg7uwf",
    logo: "atom.svg",
  },
  TEST2: {
    contractAddress: "orai1gwe4q8gme54wdk0gcrtsh4ykwvd7l9n3dxxas2",
    logo: "atom.svg",
  },
};

const mockBalance = {
  ORAI: 800000,
  AIRI: 80000.09,
  ATOM: 50000.09,
  TEST1: 8000.122,
  TEST2: 800.3434,
};

const mockPrice = {
  ORAI: 5.01,
  AIRI: 0.89,
  TEST1: 1,
  TEST2: 1,
};

// function numberWithCommas(x: number) {
//   return x.toFixed(6).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
// }

type TokenName = keyof typeof mockToken;
type PairName = keyof typeof mockPair;

interface ValidToken {
  title: TokenName;
  balance: number;
  contractAddress: string;
  logo: string;
}

interface SwapProps { }

const Swap: React.FC<SwapProps> = () => {
  const allToken: ValidToken[] = Object.keys(mockToken).map((name) => {
    return {
      ...mockToken[name as TokenName],
      title: name as TokenName,
      balance: mockBalance[name as TokenName],
    };
  });
  const [isOpenSettingModal, setIsOpenSettingModal] = useState(false);
  const [isSelectFrom, setIsSelectFrom] = useState(false);
  const [isSelectTo, setIsSelectTo] = useState(false);
  const [isSelectFee, setIsSelectFee] = useState(false);
  const [fromToken, setFromToken] = useState<TokenName>("ORAI");
  const [toToken, setToToken] = useState<TokenName>("AIRI");
  const [feeToken, setFeeToken] = useState<TokenName>("AIRI");
  const [listValidTo, setListValidTo] = useState<ValidToken[]>([]);
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  // const [currentPair, setCurrentPair] = useState<PairName>("ORAI-AIRI");
  const [averageRatio, setAverageRatio] = useState(0);
  const [slippage, setSlippage] = useState(1);

  useEffect(() => {
    let listTo = getListPairedToken(fromToken);
    const listToken = allToken.filter((t) => listTo.includes(t.title));
    console.log("list token: ", listToken);
    setListValidTo([...listToken]);
    if (!listTo.includes(toToken)) setToToken(listTo[0] as TokenName);
  }, [fromToken]);

  // useEffect(() => {
  //   const pairName = Object.keys(mockPair).find(
  //     (p) => p.includes(fromToken) && p.includes(toToken)
  //   );
  //   // setCurrentPair(pairName as PairName);

  //   // const { amount1, amount2 } = mockPair[pairName as PairName];
  //   // let rate;
  //   // if (currentPair.indexOf(fromToken) === 0) rate = amount2 / amount1;
  //   // else rate = amount1 / amount2;
  //   // setFromToRatio(rate);
  // }, [fromToken, toToken]);

  const onChangeFromAmount = (amount: number) => {
    setFromAmount(amount);
  };

  const onMaxFromAmount = (amount: number) => {
    let finalAmount = parseFloat(parseDisplayAmount(amount, fromTokenInfoData?.decimals));
    setFromAmount(finalAmount);
  };

  // const onChangeToAmount = (amount: number) => {
  //   setToAmount(amount);
  //   setFromAmount(amount / fromToRatio);
  // };

  const getTokenDenom = (token) => {
    return mockToken[token].denom ? mockToken[token].denom : undefined
  }

  const { data: taxRate, isLoading: isTaxRateLoading } = useQuery(['tax-rate'], () => fetchTaxRate());

  const { data: fromTokenInfoData, error: fromTokenInfoError, isError: isFromTokenInfoError, isLoading: isFromTokenInfoLoading } = useQuery(['from-token-info', fromToken], () => fetchTokenInfo(mockToken[fromToken].contractAddress, getTokenDenom(fromToken)));

  const { data: toTokenInfoData, error: toTokenInfoError, isError: isToTokenInfoError, isLoading: isToTokenInfoLoading } = useQuery(['to-token-info', toToken], () => fetchTokenInfo(mockToken[toToken].contractAddress, getTokenDenom(toToken)));

  const { data: fromTokenBalance, error: fromTokenBalanceError, isError: isFromTokenBalanceError, isLoading: isFromTokenBalanceLoading } = useQuery(['from-token-balance', fromToken], () => fetchBalance(mockToken[fromToken].contractAddress, "orai14n3tx8s5ftzhlxvq0w5962v60vd82h30rha573", getTokenDenom(fromToken)));

  const { data: toTokenBalance, error: toTokenBalanceError, isError: isToTokenBalanceError, isLoading: isLoadingToTokenBalance } = useQuery(['to-token-balance', toToken], () => fetchBalance(mockToken[toToken].contractAddress, "orai14n3tx8s5ftzhlxvq0w5962v60vd82h30rha573", getTokenDenom(toToken)));

  // const { data: exchangeRate, error: exchangeRateError, isError: isExchangeRateError, isLoading: isExchangeRateLoading } = useQuery(['exchange-rate', fromTokenInfoData, toTokenInfoData], () => fetchExchangeRate(fromTokenInfoData?.symbol.toLocaleLowerCase(), toTokenInfoData?.symbol.toLocaleLowerCase()), { enabled: fromTokenInfoData !== undefined && toTokenInfoData !== undefined });

  const { data: simulateData, error: simulateDataError, isError: isSimulateDataError, isLoading: isSimulateDataLoading } = useQuery(['simulate-data', fromTokenInfoData, toTokenInfoData, fromAmount], () => simulateSwap({ fromInfo: fromTokenInfoData, toInfo: toTokenInfoData, amount: parseAmount(fromAmount, fromTokenInfoData?.decimals) }), { enabled: !!fromTokenInfoData && !!toTokenInfoData });

  const { data: poolData, isLoading: isPoolDataLoading } = useQuery(['pool-info-amount', fromTokenInfoData, toTokenInfoData], () => fetchPoolInfoAmount(fromTokenInfoData, toTokenInfoData), { enabled: !!fromTokenInfoData && !!toTokenInfoData && !!taxRate });

  // useEffect(() => {
  //   console.log("exchange rate: ", exchangeRate?.item?.exchange_rate)
  //   // TODO: need to re-calculate this
  //   setFromToRatio(1 / parseFloat(exchangeRate?.item?.exchange_rate));
  // }, [isExchangeRateLoading]);

  const calculateToAmount = (poolData, offerAmount, taxRate) => {
    const cp = poolData.offerPoolAmount * poolData.askPoolAmount;
    return (poolData.askPoolAmount - cp / (poolData.offerPoolAmount + offerAmount)) * (1 - taxRate);
  }

  useEffect(() => {
    if (poolData && fromAmount && fromAmount > 0) {
      const finalToAmount = calculateToAmount(poolData, parseInt(parseAmount(fromAmount, fromTokenInfoData?.decimals)), parseFloat(taxRate?.rate));
      setToAmount(parseFloat(parseDisplayAmount(finalToAmount, toTokenInfoData?.decimals)).toFixed(6));
    }
  }, [poolData, fromAmount]);

  useEffect(() => {
    if (poolData) {
      const finalAverageRatio = calculateToAmount(poolData, 1, parseFloat(taxRate?.rate));
      setAverageRatio(parseFloat(finalAverageRatio));
    }
  }, [poolData]);

  const handleSubmit = async () => {
    try {
      let walletAddr;
      if (await window.Keplr.getKeplr()) walletAddr = await window.Keplr.getKeplrAddr();
      else throw "You have to install Keplr wallet to swap"

      const msgs = await generateContractMessages({
        type: Type.SWAP,
        sender: `${walletAddr}`,
        amount: parseAmount(fromAmount, fromTokenInfoData?.decimals),
        fromInfo: fromTokenInfoData,
        toInfo: toTokenInfoData,
      });

      const msg = msgs[0];
      console.log("msgs: ", msgs.map(msg => ({ ...msg, msg: Buffer.from(msg.msg).toString() })));
      const result = await CosmJs.execute({ prefix: ORAI, address: msg.contract, walletAddr, handleMsg: Buffer.from(msg.msg.toString()), gasAmount: { denom: ORAI, amount: "0" }, handleOptions: { funds: msg.sent_funds } });
      console.log("result swap tx hash: ", result);

      if (result) {
        console.log("in correct result");
        displayToast(TToastType.TX_SUCCESSFUL, {
          customLink: `${network.explorer}/txs/${result.transactionHash}`
        });
        return;
      }
    } catch (error) {
      console.log("error in swap form: ", error);
      displayToast(TToastType.TX_FAILED, {
        message: error
      });
    }
  }


  const getListPairedToken = (tokenName: TokenName) => {
    let pairs = Object.keys(mockPair).filter((name) =>
      name.includes(tokenName)
    );
    return pairs!.map((name) =>
      name.replace(tokenName, "").replace("-", "")
    );
  };

  return (
    <Layout>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className={cx("container")}>
          <div className={cx("from")}>
            <div className={cx("header")}>
              <div className={cx("title")}>FROM</div>
              <img
                className={cx("btn")}
                src={
                  require("assets/icons/setting.svg").default
                }
                onClick={() => setIsOpenSettingModal(true)}
              />
              <img
                className={cx("btn")}
                src={
                  require("assets/icons/refresh.svg").default
                }
              />
            </div>
            <div className={cx("balance")}>
              <span>{`Balance: ${parseDisplayAmount(fromTokenBalance, fromTokenInfoData?.decimals)} ${fromTokenInfoData?.symbol.toUpperCase()}`}</span>
              <div
                className={cx("btn")}
                onClick={() =>
                  onMaxFromAmount(fromTokenBalance)
                }
              >
                MAX
              </div>
              <div
                className={cx("btn")}
                onClick={() =>
                  onMaxFromAmount(fromTokenBalance / 2)
                }
              >
                HALF
              </div>
              {/* <span style={{ flexGrow: 1, textAlign: "right" }}>
                {`~$${numberWithCommas(
                  +(
                    mockBalance[fromToken] *
                    mockPrice[fromToken]
                  ).toFixed(2)
                )}`}
              </span> */}
            </div>
            <div className={cx("input")}>
              <div
                className={cx("token")}
                onClick={() => setIsSelectFrom(true)}
              >
                <img
                  className={cx("logo")}
                  src={
                    require(`assets/icons/${mockToken[fromToken].logo}`)
                      .default
                  }
                />
                <span>{fromToken}</span>
                <div className={cx("arrow-down")} />
              </div>
              <input
                className={cx("amount")}
                value={fromAmount ? fromAmount : ""}
                placeholder="0"
                type="number"
                step={`${parseDisplayAmount(1, fromTokenInfoData?.decimals)}`}
                onChange={(e) => {
                  onChangeFromAmount(e.target.value);
                }}
              />
            </div>
            <div className={cx("fee")}>
              <span>Fee</span>
              <div
                className={cx("token")}
                onClick={() => setIsSelectFee(true)}
              >
                <img
                  className={cx("logo")}
                  src={
                    require(`assets/icons/${mockToken[feeToken].logo}`)
                      .default
                  }
                />
                <span>{feeToken}</span>
                <div className={cx("arrow-down")} />
              </div>
            </div>
          </div>
          <div className={cx("swap-icon")}>
            <img
              src={require("assets/icons/ant_swap.svg").default}
              onClick={() => {
                const t = fromToken,
                  k = fromAmount;
                setFromToken(toToken);
                setToToken(t);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }}
            />
          </div>
          <div className={cx("from")}>
            <div className={cx("header")}>
              <div className={cx("title")}>TO</div>
            </div>
            <div className={cx("balance")}>
              <span>{`Balance: ${parseDisplayAmount(toTokenBalance, toTokenInfoData?.decimals)} ${toTokenInfoData?.symbol.toUpperCase()}`}</span>

              <span style={{ flexGrow: 1, textAlign: "right" }}>
                {`1 ${fromToken} ≈ ${averageRatio.toFixed(6)} ${toToken}`}
              </span>
              <TooltipIcon />
            </div>
            <div className={cx("input")}>
              <div
                className={cx("token")}
                onClick={() => setIsSelectTo(true)}
              >
                <img
                  className={cx("logo")}
                  src={
                    require(`assets/icons/${mockToken[toToken].logo}`)
                      .default
                  }
                />
                <span>{toToken}</span>
                <div className={cx("arrow-down")} />
              </div>
              <input
                className={cx("amount")}
                value={toAmount ? toAmount : ""}
                placeholder="0"
                type="number"
                step={`${parseDisplayAmount(1, toTokenInfoData?.decimals)}`}
              // onChange={(e) => {
              //   onChangeToAmount(e.target.value);
              // }}
              // disabled={true}
              />
            </div>
          </div>
          <div className={cx("swap-btn")} onClick={handleSubmit}>
            Swap
          </div>
          <div className={cx("detail")}>
            <div className={cx("row")}>
              <div className={cx("title")}>
                <span>Minimum Received</span>
                <TooltipIcon />
              </div>
              <span>{`${parseDisplayAmount(simulateData?.amount, toTokenInfoData?.decimals)} ${toTokenInfoData?.symbol.toUpperCase()}`}</span>
            </div>
            {/* <div className={cx("row")}>
              <div className={cx("title")}>
                <span>Tx Fee</span>
                <TooltipIcon />
              </div>
              <span>2,959,898.60 AIRI</span>
            </div> */}
            <div className={cx("row")}>
              <div className={cx("title")}>
                <span>Tax rate</span>
                <TooltipIcon />
              </div>
              <span>{taxRate?.rate} %</span>
            </div>
          </div>
          <SettingModal
            isOpen={isOpenSettingModal}
            open={() => setIsOpenSettingModal(true)}
            close={() => setIsOpenSettingModal(false)}
            slippage={slippage}
            setSlippage={setSlippage}
          />

          {isSelectFrom ? (
            <SelectTokenModal
              isOpen={isSelectFrom}
              open={() => setIsSelectFrom(true)}
              close={() => setIsSelectFrom(false)}
              listToken={allToken}
              setToken={setFromToken}
            />
          ) : (
            <SelectTokenModal
              isOpen={isSelectTo}
              open={() => setIsSelectTo(true)}
              close={() => setIsSelectTo(false)}
              listToken={listValidTo}
              setToken={setToToken}
            />
          )}
          <SelectTokenModal
            isOpen={isSelectFee}
            open={() => setIsSelectFee(true)}
            close={() => setIsSelectFee(false)}
            listToken={allToken}
            setToken={setFeeToken}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Swap;
