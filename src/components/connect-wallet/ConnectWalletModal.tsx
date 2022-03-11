import LoginMetamask from "components/LoginMetamask";
import LoginWidget from "components/LoginWidget";
import Modal from "components/Modal";
import React from "react";
import SSOWidget, { SSOWidgetType } from "./SSOWidget";
import "./SSOWidget.scss";
import MESSAGE from "lang/MESSAGE.json";
import style from "./ConnectWalletModal.module.scss";
import cn from "classnames/bind";

const cx = cn.bind(style);

interface ConnectWalletModalProps {
  isOpen: boolean;
  close: () => void;
  open: () => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  close,
  open,
}) => {
  return (
    <Modal isOpen={isOpen} close={close} open={open} isCloseBtn={true}>
      <div className={cx("select")}>
        <div className={cx("title")}>
          <div>Connect wallet</div>
        </div>
        <div className={cx("options")}>
          <LoginWidget text={MESSAGE.Form.Button.ConnectKeplr} />
          <LoginMetamask text={MESSAGE.Form.Button.ConnectMetamask} />
          <SSOWidget
            type={SSOWidgetType.inline}
            text="Connect Wallet"
            buttonStyle={{
              height: "40px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              fontFamily: "Source Sans Pro",
              fontSize: "16px",
              lineHeight: "150%",
              color: "#f6f7fb",
              margin: "0 0 0px",
              borderRadius: "4px",
              background: "linear-gradient(180deg, #612FCA 0%, #612FCA 100%)",
            }}
          /></div>
      </div>
    </Modal>
  );
};

export default ConnectWalletModal;
