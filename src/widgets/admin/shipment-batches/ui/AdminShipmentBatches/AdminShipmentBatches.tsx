import {
  formatPositionRange,
  formatShipPeriod,
  useAdminPreorderCampaign,
  useAdminProduct,
  useAdminShipmentBatches,
  useSaveAdminShipmentBatches,
  type AdminShipmentBatch,
} from '@entities/admin-product'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { showToast } from '@shared/model/toastStore'
import { InlineAlert, Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { ShipmentBatchEditor } from '../ShipmentBatchEditor'
import { ShipmentBatchProgress } from '../ShipmentBatchProgress'

import * as styles from './AdminShipmentBatches.css'

export type AdminShipmentBatchesProps = {
  productId: string
}

const readColumns: TableColumn<AdminShipmentBatch>[] = [
  {
    key: 'batch',
    header: '차수',
    align: 'center',
    render: (batch) => `${batch.batchNumber}차`,
  },
  {
    key: 'position',
    header: '순번',
    align: 'center',
    width: '30%',
    render: (batch) => formatPositionRange(batch),
  },
  {
    key: 'period',
    header: '예상 배송 기간',
    align: 'center',
    width: '50%',
    render: (batch) => formatShipPeriod(batch),
  },
]

/**
 * 사전 예약 상품의 배송 차수. 오픈 전에는 바로 고치고(ShipmentBatchEditor), 오픈한
 * 뒤에는 읽기만 한다(ShipmentBatchProgress) — 이미 배정된 순번의 배송 약속을 뒤에서
 * 바꾸면 안 되고, 서버도 409로 막는다. 오픈 뒤에는 차수별로 순번이 얼마나 나갔는지를
 * 회차의 발급 순번 수로 보여준다.
 */
export function AdminShipmentBatches({ productId }: AdminShipmentBatchesProps) {
  const product = useAdminProduct(productId)
  const shipmentBatches = useAdminShipmentBatches(productId)
  const save = useSaveAdminShipmentBatches(productId)
  // 차수 교체는 오픈 뒤 409다 — 접수 중(OPEN)뿐 아니라 마감(CLOSED)도 이미 오픈한 뒤다.
  const campaignStatus = product.data?.campaign?.status
  const opened = campaignStatus === 'OPEN' || campaignStatus === 'CLOSED'
  const campaign = useAdminPreorderCampaign(productId, { enabled: opened })

  // 회차가 아직 없으면 서버가 404를 준다 — 차수는 회차에 딸려 있어 먼저 만들 수 없다.
  const noCampaign =
    shipmentBatches.error instanceof ApiRequestError &&
    shipmentBatches.error.status === 404

  if (shipmentBatches.data && product.data) {
    const batches = shipmentBatches.data
    return (
      <div className={styles.root}>
        {/* 다시 불러오기에 실패해도 이전 데이터는 남아 그대로 보인다 — 그 사실을 따로 알린다. */}
        {shipmentBatches.isError && (
          <InlineAlert status="warning">
            {getErrorMessage(
              shipmentBatches.error,
              '배송 차수를 다시 불러오지 못했습니다.',
            )}{' '}
            이전에 불러온 내용을 표시하고 있습니다.
          </InlineAlert>
        )}
        {opened ? (
          <>
            {campaign.isError && (
              <InlineAlert status="warning">
                {getErrorMessage(
                  campaign.error,
                  '발급한 순번 수를 불러오지 못했습니다.',
                )}
              </InlineAlert>
            )}
            <ShipmentBatchProgress
              batches={batches}
              issuedCount={campaign.data?.issuedCount}
              accepting={campaignStatus === 'OPEN'}
            />
          </>
        ) : (
          <ShipmentBatchEditor
            // 서버 값이 바뀌면(저장·다른 관리자) 초안을 새로 채운다.
            key={shipmentBatches.dataUpdatedAt}
            batches={batches}
            saving={save.isPending}
            saveError={save.error}
            onDismissError={save.reset}
            onSave={(body) =>
              save.mutate(body, {
                onSuccess: () => showToast('배송 구간을 저장했습니다.'),
              })
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Table
        columns={readColumns}
        rows={[]}
        rowKey={(batch) => String(batch.batchNumber)}
        // 조회 실패를 '차수 없음'으로 보이면 운영 판단이 정반대가 된다.
        // 회차가 없으면 조회를 안 해 계속 pending이다 — 그때는 로딩이 아니라 안내를 띄운다.
        loading={!noCampaign && !shipmentBatches.isError && !product.isError}
        loadingRows={3}
        emptyMessage={
          noCampaign
            ? '사전예약 회차가 아직 없어 배송 차수를 정할 수 없습니다. 판매 일정을 먼저 저장해 주세요.'
            : getErrorMessage(
                shipmentBatches.error ?? product.error,
                '배송 차수를 불러오지 못했습니다.',
              )
        }
      />
    </div>
  )
}
