"use client"

import React, { useState, useEffect } from 'react'
import { Button, Input } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"

interface PickupPoint {
  id: string
  name: string
  city: string
  street: string
  zip: string
  country: string
  latitude?: string
  longitude?: string
  details?: {
    max_weight?: number
    dressingRoom?: boolean
    claimAssistant?: boolean
    packetConsignment?: boolean
  }
}

interface PacketaWidgetProps {
  cartId: string
  onPickupPointSelect: (pickupPoint: PickupPoint) => void
  selectedPickupPoint?: PickupPoint
}

export const PacketaWidget: React.FC<PacketaWidgetProps> = ({
  cartId,
  onPickupPointSelect,
  selectedPickupPoint,
}) => {
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  useEffect(() => {
    if (isModalOpen) {
      fetchPickupPoints()
    }
  }, [searchTerm, isModalOpen])

  const fetchPickupPoints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append('city', searchTerm)
      }
      
      const response = await fetch(`${backendUrl}/store/packeta/pickup-points?${params}`)
      const data = await response.json()
      setPickupPoints(data.pickup_points || [])
    } catch (error) {
      console.error('Error fetching pickup points:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPickupPoint = async (pickupPoint: PickupPoint) => {
    try {
      const response = await fetch(`${backendUrl}/store/packeta/select-pickup-point`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId,
          pickup_point_id: pickupPoint.id,
          pickup_point_name: pickupPoint.name,
          pickup_point_address: `${pickupPoint.street}, ${pickupPoint.city} ${pickupPoint.zip}`
        })
      })

      if (response.ok) {
        onPickupPointSelect(pickupPoint)
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('Error selecting pickup point:', error)
    }
  }

  return (
    <div className="packeta-widget">
      <div className="pickup-point-selector">
        <label className="block text-base-semi text-gray-700 mb-2">
          Výběr výdejního místa Zásilkovny
        </label>
        
        {selectedPickupPoint ? (
          <div className="selected-pickup-point p-4 border border-green-300 bg-green-50 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-green-800">{selectedPickupPoint.name}</p>
                <p className="text-small-regular text-green-600">
                  {selectedPickupPoint.street}, {selectedPickupPoint.city} {selectedPickupPoint.zip}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Změnit
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="base"
            onClick={() => setIsModalOpen(true)}
            className="w-full justify-start text-left"
          >
            <span className="text-gray-600">Vyberte výdejní místo Zásilkovny</span>
          </Button>
        )}
      </div>

      <Modal isOpen={isModalOpen} close={() => setIsModalOpen(false)}>
        <Modal.Title>Výběr výdejního místa</Modal.Title>
        <Modal.Body>
          <div className="mb-4">
            <Input
              placeholder="Hledat podle města..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4">Načítání...</div>
            ) : (
              <>
                {pickupPoints.map((point) => (
                  <div
                    key={point.id}
                    onClick={() => handleSelectPickupPoint(point)}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="font-medium">{point.name}</div>
                    <div className="text-small-regular text-gray-600">
                      {point.street}, {point.city} {point.zip}
                    </div>
                    {point.details && (
                      <div className="text-xsmall-regular text-gray-500 mt-1">
                        {point.details.dressingRoom && "👗 Zkušebna "} 
                        {point.details.claimAssistant && "🛍️ Asistent reklamací "} 
                        {point.details.packetConsignment && "📦 Balíkové zásilky"}
                      </div>
                    )}
                  </div>
                ))}
                {pickupPoints.length === 0 && !loading && (
                  <div className="text-center py-4 text-gray-500">
                    Žádná výdejní místa nenalezena
                  </div>
                )}
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default PacketaWidget
