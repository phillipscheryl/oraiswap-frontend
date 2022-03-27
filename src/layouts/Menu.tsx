import { Button, Typography } from 'antd';
import { ReactComponent as LogoFull } from 'assets/images/OraiDEX_full_light.svg';
import { ReactComponent as Swap } from 'assets/icons/swap.svg';
import { ReactComponent as Wallet } from 'assets/icons/wallet.svg';
import { ReactComponent as Pools } from 'assets/icons/pool.svg';
import { ReactComponent as Dark } from 'assets/icons/dark.svg';
import { ReactComponent as Light } from 'assets/icons/light.svg';
import { ReactComponent as Logout } from 'assets/icons/logout.svg';
import { ThemeContext, Themes } from 'context/theme-context';

import React, {
  memo,
  useContext,
  useEffect,
  useState,
  ReactElement
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Menu.module.scss';
import RequireAuthButton from 'components/connect-wallet/RequireAuthButton';
// import { isLoggedIn } from 'providers/AuthProvider';
import { network } from 'constants/networks';
import useLocalStorage from 'libs/useLocalStorage';
import CenterEllipsis from 'components/CenterEllipsis';
import AvatarPlaceholder from 'components/AvatarPlaceholder/AvatarPlaceholder';
import { useQuery } from 'react-query';
import TokenBalance from 'components/TokenBalance';
import { ORAI } from 'constants/constants';
import Loader from 'components/Loader';
import { isMobile } from '@walletconnect/browser-utils';
import Icon from 'components/Icon';
import classNames from 'classnames';

const { Text } = Typography;

const Menu: React.FC<{}> = React.memo((props) => {
  const location = useLocation();
  const [link, setLink] = useState('/');
  const { theme, setTheme } = useContext(ThemeContext);
  const [address, setAddress] = useLocalStorage<String>('address');
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };
  const {
    isLoading,
    error,
    data: balanceData
  } = useQuery(
    'balance',
    () =>
      fetch(`${network.lcd}/cosmos/bank/v1beta1/balances/${address}`).then(
        (res) => res.json()
      ),
    { enabled: address ? address.length > 0 : false }
  );

  useEffect(() => {
    setLink(location.pathname);
  }, []);

  const renderLink = (
    to: string,
    title: string,
    onClick: any,
    icon: ReactElement
  ) => {
    return (
      <Link
        to={to}
        onClick={() => onClick(to)}
        className={styles.menu_item + (link === to ? ` ${styles.active}` : '')}
      >
        {icon}
        <Text className={styles.menu_item_text}>{title}</Text>
      </Link>
    );
  };

  const mobileMode = isMobile();

  return (
    <>
      {mobileMode && (
        <div className={styles.logo}>
          <Link to={'/'} onClick={() => setLink('/')}>
            <LogoFull />
          </Link>
          <Icon
            size={44}
            name={open ? 'menu_open' : 'menu'}
            onClick={handleToggle}
          />
        </div>
      )}
      <div className={classNames(styles.menu, { [styles.open]: open })}>
        <div>
          {!mobileMode && (
            <Link to={'/'} onClick={() => setLink('/')} className={styles.logo}>
              <LogoFull />
            </Link>
          )}
          <div className={styles.menu_items}>
            <RequireAuthButton
              address={address}
              setAddress={setAddress}
              className={styles.connect_btn}
            >
              {address ? (
                <div className={styles.token_info}>
                  <AvatarPlaceholder
                    address={address}
                    className={styles.token_avatar}
                  />
                  <div className={styles.token_info_balance}>
                    <CenterEllipsis
                      size={6}
                      text={address}
                      className={styles.token_address}
                    />
                    {(() => {
                      let balance = balanceData?.balances?.find(
                        (balance: { denom: string; amount: string }) =>
                          balance.denom === ORAI
                      );

                      if (!!balance)
                        return (
                          <TokenBalance
                            balance={balance}
                            className={styles.token_balance}
                            decimalScale={6}
                          />
                        );
                    })()}
                  </div>
                </div>
              ) : (
                <Text className={styles.connect}>Connect wallet</Text>
              )}
              {!!address && (
                <Logout
                  onClick={(e) => {
                    setAddress('');
                    // LocalStorage.removeItem(LocalStorageKey.token);
                    // window.location.reload();
                  }}
                  style={{ width: 35, height: 35 }}
                />
              )}
            </RequireAuthButton>
            {renderLink(
              '/swap',
              'Swap',
              setLink,
              <Swap style={{ width: 30, height: 30 }} />
            )}
            {renderLink(
              '/pools',
              'Pools',
              setLink,
              <Pools style={{ width: 30, height: 30 }} />
            )}
            {renderLink(
              '/bridge',
              'Bridge',
              setLink,
              <Wallet style={{ width: 30, height: 30 }} />
            )}
          </div>
        </div>

        <div>
          <div className={styles.menu_themes}>
            <Button
              className={
                styles.menu_theme +
                (theme === Themes.dark ? ` ${styles.active}` : '')
              }
              onClick={() => {
                setTheme(Themes.dark);
              }}
            >
              <Dark style={{ width: 15, height: 15 }} />
              <Text className={styles.menu_theme_text}>Dark</Text>
            </Button>
            <Button
              className={
                styles.menu_theme +
                (theme === Themes.light ? ` ${styles.active}` : '')
              }
              onClick={() => {
                setTheme(Themes.light);
              }}
            >
              <Light style={{ width: 15, height: 15 }} />
              <Text className={styles.menu_theme_text}>Light</Text>
            </Button>
          </div>

          <div className={styles.menu_footer}>© 2022 Powered by Oraichain</div>
        </div>
      </div>
    </>
  );
});

export default memo(Menu);
