import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Drawer, Tabs, Tooltip } from 'antd';
import { unionBy } from 'lodash';
import {
  WALLET_BRAND_CONTENT,
  KEYRING_ICONS,
  KEYRING_TYPE_TEXT,
  BRAND_ALIAN_TYPE_TEXT,
} from 'consts';
import { useWallet } from 'ui/utils';
import { AddressViewer, FieldCheckbox } from '..';
import {
  UIContactBookItem,
  ContactBookStore,
} from 'background/service/contactBook';

import './style.less';

interface ListModalProps {
  address?: string;
  visible: boolean;
  onOk(data: UIContactBookItem, type: string): void;
  onCancel(): void;
}
interface Account {
  address: string;
  brandName: string;
  type: string;
}
const { TabPane } = Tabs;
const ListModal = ({ address, visible, onOk, onCancel }: ListModalProps) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const [alianNamesMap, setAlianNamesMap] = useState<ContactBookStore>({});
  const [list, setList] = useState<UIContactBookItem[]>([]);
  const [alianNames, setAlianNames] = useState({});
  const [accountList, setAccountList] = useState<Account[]>([]);
  const handleVisibleChange = async () => {
    if (visible) {
      const data = await wallet.listContact();
      const importedList = await wallet.getAllAlianName();
      const importAccounts = await wallet.getAllVisibleAccounts();
      const importAccountsList: Account[] = unionBy(
        importAccounts
          .map((item) =>
            item.accounts.map((acc) => {
              return {
                ...acc,
                type: item.type,
              };
            })
          )
          .flat(),
        (item) => item?.address.toLowerCase()
      );
      setAccountList(importAccountsList);
      setAlianNamesMap(
        importedList.reduce(
          (res, item) => ({
            ...res,
            [item.address.toLowerCase()]: item,
          }),
          {}
        )
      );
      setList(data);
      setAlianNames(importedList);
    }
  };

  useEffect(() => {
    handleVisibleChange();
  }, [visible]);

  const handleConfirm = (data: UIContactBookItem, type: string) => {
    onOk(data, type);
  };
  const NoDataUI = (
    <div className="no-contact">
      <img
        className="no-data-image"
        src="/images/nodata-site.png"
        alt="no contact"
      />
      <p className="text-gray-content text-14 text-center">
        {t('No contacts')}
      </p>
    </div>
  );
  const formatAddressTooltip = (type: string, brandName: string) => {
    if (KEYRING_TYPE_TEXT[type]) {
      return t(KEYRING_TYPE_TEXT[type]);
    }
    if (WALLET_BRAND_CONTENT[brandName]) {
      return (
        <Trans
          i18nKey="addressTypeTip"
          values={{
            type: WALLET_BRAND_CONTENT[brandName].name,
          }}
        />
      );
    }
    return '';
  };
  return (
    <Drawer
      className="list-contact-modal"
      visible={visible}
      onClose={onCancel}
      title={null}
      placement="bottom"
      height="580px"
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab={t('Contacts')} className="text-15 tab-class" key="1">
          {list.length > 0
            ? list.map((item) => (
                <FieldCheckbox
                  key={item.address}
                  checked={
                    item.address.toLowerCase() === address?.toLowerCase()
                  }
                  className="py-8 h-[56px] mb-8 mt-0"
                  showCheckbox={false}
                  onChange={() => handleConfirm(item, 'others')}
                >
                  <div className="contact-info">
                    <p>{item.name}</p>
                    <p>
                      <AddressViewer address={item.address} showArrow={false} />
                    </p>
                  </div>
                </FieldCheckbox>
              ))
            : NoDataUI}
        </TabPane>
        <TabPane tab={t('My accounts')} className="text-15 tab-class" key="2">
          {accountList.length > 0
            ? accountList.map((account) => (
                <FieldCheckbox
                  key={account.address + account.brandName}
                  checked={
                    account?.address?.toLowerCase() === address?.toLowerCase()
                  }
                  className="py-8 h-[56px] mb-8 mt-0"
                  showCheckbox={false}
                  onChange={() =>
                    handleConfirm(
                      {
                        address: account?.address,
                        name: alianNamesMap[account?.address?.toLowerCase()]!
                          .name,
                      },
                      'my'
                    )
                  }
                >
                  <Tooltip
                    overlayClassName="rectangle addressType__tooltip"
                    placement="topRight"
                    title={formatAddressTooltip(
                      account?.type,
                      BRAND_ALIAN_TYPE_TEXT[account?.brandName]
                    )}
                  >
                    <img
                      src={
                        KEYRING_ICONS[account?.type] ||
                        WALLET_BRAND_CONTENT[account?.brandName]?.image
                      }
                      className="w-[24px] h-[24px]"
                    />
                  </Tooltip>
                  <div className="contact-info ml-12">
                    <p>
                      {alianNamesMap[account?.address?.toLowerCase()]?.name}
                    </p>
                    <p>
                      <AddressViewer
                        address={account?.address}
                        showArrow={false}
                      />
                    </p>
                  </div>
                </FieldCheckbox>
              ))
            : NoDataUI}
        </TabPane>
      </Tabs>
    </Drawer>
  );
};

export default ListModal;
