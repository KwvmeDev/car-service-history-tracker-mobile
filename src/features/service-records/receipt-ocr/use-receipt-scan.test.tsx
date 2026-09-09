import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import TextRecognition from '@react-native-ml-kit/text-recognition'

import { useReceiptScan } from './use-receipt-scan'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))

const mockPicker = jest.mocked(ImagePicker)
const mockRecognize = jest.mocked(TextRecognition.recognize)

const granted = { granted: true } as ImagePicker.PermissionResponse
const asset = { assets: [{ uri: 'file:///receipt.jpg' }], canceled: false } as ImagePicker.ImagePickerResult

beforeEach(() => {
  mockPicker.requestCameraPermissionsAsync.mockResolvedValue(granted)
  mockPicker.requestMediaLibraryPermissionsAsync.mockResolvedValue(granted)
  mockPicker.launchCameraAsync.mockResolvedValue(asset)
  mockPicker.launchImageLibraryAsync.mockResolvedValue(asset)
})

describe('useReceiptScan', () => {
  it('runs OCR on the picked photo and exposes the parsed extraction', async () => {
    mockRecognize.mockResolvedValue({
      text: "Ace Auto\nDate 06/01/2026\nTOTAL DUE $80.00",
      blocks: [],
    })
    const { result } = renderHook(() => useReceiptScan())
    expect(result.current.state).toBe('idle')

    await act(async () => {
      await result.current.scan('camera')
    })

    await waitFor(() => {
      expect(result.current.state).toBe('done')
    })
    expect(result.current.extraction?.costMinor?.value).toBe(8000)
    expect(result.current.extraction?.shopName?.value).toBe('Ace Auto')
  })

  it('does nothing when the photo pick is cancelled', async () => {
    mockPicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as unknown as ImagePicker.ImagePickerResult)
    const { result } = renderHook(() => useReceiptScan())

    await act(async () => {
      await result.current.scan('library')
    })
    expect(result.current.state).toBe('idle')
    expect(mockRecognize).not.toHaveBeenCalled()
  })

  it('skips the scan when permission is denied', async () => {
    mockPicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as ImagePicker.PermissionResponse)
    const { result } = renderHook(() => useReceiptScan())

    await act(async () => {
      await result.current.scan('camera')
    })
    expect(result.current.state).toBe('idle')
  })

  it('surfaces an OCR failure as the error state', async () => {
    mockRecognize.mockRejectedValue(new Error('ml kit failed'))
    const { result } = renderHook(() => useReceiptScan())

    await act(async () => {
      await result.current.scan('camera')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.extraction).toBeNull()
  })

  it('reset clears the extraction and returns to idle', async () => {
    mockRecognize.mockResolvedValue({ text: 'Shop\nTotal $10.00', blocks: [] })
    const { result } = renderHook(() => useReceiptScan())
    await act(async () => {
      await result.current.scan('camera')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.extraction).toBeNull()
  })
})
