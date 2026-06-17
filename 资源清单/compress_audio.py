"""
MP3音频压缩脚本 v2 - 修复帧遍历和裁剪逻辑
"""
import os
import shutil

AUDIO_DIR = r'C:\Users\AS\Desktop\腾讯游戏-公益赛道\tencent-game-helpharbour\资源清单\音频资源'

BITRATE_TABLE_V1 = {
    0: 0, 1: 32, 2: 40, 3: 48, 4: 56, 5: 64,
    6: 80, 7: 96, 8: 112, 9: 128, 10: 160,
    11: 192, 12: 224, 13: 256, 14: 320
}
BITRATE_TABLE_V2 = {
    0: 0, 1: 8, 2: 16, 3: 24, 4: 32, 5: 40,
    6: 48, 7: 56, 8: 64, 9: 80, 10: 96,
    11: 112, 12: 128, 13: 144, 14: 160
}
SAMPLING_RATE_V1 = {0: 44100, 1: 48000, 2: 32000}
SAMPLING_RATE_V2 = {0: 22050, 1: 24000, 2: 16000}
SAMPLING_RATE_V25 = {0: 11025, 1: 12000, 2: 8000}

def skip_id3_tag(data, offset):
    if data[offset:offset+3] == b'ID3':
        size_bytes = data[offset+6:offset+10]
        tag_size = (size_bytes[0]<<21) | (size_bytes[1]<<14) | (size_bytes[2]<<7) | size_bytes[3]
        return offset + 10 + tag_size
    return offset

def find_id3v1_end(data):
    if len(data) >= 128 and data[-128:-125] == b'TAG':
        return len(data) - 128
    return len(data)

def parse_frame(data, offset):
    """解析MP3帧头，返回帧信息字典或None"""
    if offset + 4 > len(data):
        return None
    b0, b1, b2, b3 = data[offset], data[offset+1], data[offset+2], data[offset+3]
    
    # 检查同步字
    if b0 != 0xFF or (b1 & 0xE0) != 0xE0:
        return None
    
    version_id = (b1 >> 3) & 0x03  # 0=MPEG2.5, 1=reserved, 2=MPEG2, 3=MPEG1
    layer_id = (b1 >> 1) & 0x03    # 1=Layer3, 2=Layer2, 3=Layer1
    protection = b1 & 0x01
    
    if version_id == 1 or layer_id == 0:
        return None
    
    bitrate_index = (b2 >> 4) & 0x0F
    sr_index = (b2 >> 2) & 0x03
    padding = (b2 >> 1) & 0x01
    channel_mode = (b3 >> 6) & 0x03
    
    # 确定比特率
    if version_id == 3:  # MPEG1
        bitrate = BITRATE_TABLE_V1.get(bitrate_index, 0)
        sr = SAMPLING_RATE_V1.get(sr_index, 44100)
        samples_per_frame = 1152
    elif version_id == 2:  # MPEG2
        bitrate = BITRATE_TABLE_V2.get(bitrate_index, 0)
        sr = SAMPLING_RATE_V2.get(sr_index, 22050)
        samples_per_frame = 576
    else:  # MPEG2.5
        bitrate = BITRATE_TABLE_V2.get(bitrate_index, 0)
        sr = SAMPLING_RATE_V25.get(sr_index, 11025)
        samples_per_frame = 576
    
    if bitrate == 0 or sr == 0:
        return None
    
    # 计算帧大小
    if version_id == 3:  # MPEG1
        frame_size = int(144 * bitrate * 1000 / sr) + padding
    else:  # MPEG2/2.5
        frame_size = int(72 * bitrate * 1000 / sr) + padding
    
    duration = samples_per_frame / sr
    
    return {
        'offset': offset,
        'size': frame_size,
        'duration': duration,
        'bitrate': bitrate,
        'version': version_id,
        'layer': layer_id,
    }

def trim_mp3(filename, target_seconds):
    """裁剪MP3到指定秒数，保留ID3标签"""
    filepath = os.path.join(AUDIO_DIR, filename)
    
    with open(filepath, 'rb') as f:
        data = bytearray(f.read())
    
    original_size = len(data)
    
    # 提取ID3v2标签
    audio_start = skip_id3_tag(data, 0)
    id3v2 = bytes(data[:audio_start])
    
    # 提取ID3v1标签
    audio_end = find_id3v1_end(data)
    id3v1 = bytes(data[audio_end:]) if audio_end < len(data) else b''
    
    # 遍历帧，收集到目标时长
    offset = audio_start
    collected_frames = bytearray()
    accumulated_time = 0.0
    
    while offset < audio_end:
        frame = parse_frame(data, offset)
        if frame is None:
            # 可能是同步错误或其他数据，跳过一个字节
            offset += 1
            continue
        
        if accumulated_time + frame['duration'] > target_seconds + 0.1:
            break
        
        collected_frames.extend(data[offset:offset + frame['size']])
        accumulated_time += frame['duration']
        offset += frame['size']
    
    # 备份
    backup_path = filepath + '.bak'
    if not os.path.exists(backup_path):
        shutil.copy2(filepath, backup_path)
    
    # 组合新文件
    new_data = id3v2 + bytes(collected_frames) + id3v1
    with open(filepath, 'wb') as f:
        f.write(new_data)
    
    new_size = len(new_data)
    saved_kb = (original_size - new_size) / 1024
    print(f"  裁剪到 {accumulated_time:.2f}s (目标{target_seconds}s)")
    print(f"  原始: {original_size/1024:.1f}KB -> 新: {new_size/1024:.1f}KB (节省 {saved_kb:.1f}KB)")
    
    return new_size

def main():
    print("=== MP3音频压缩 v2 ===\n")
    
    # 38: 火势燃烧 115s -> 裁到12s循环段
    print("[38] 火势燃烧环境音")
    trim_mp3('38 火势燃烧环境音.mp3', 12)
    print()
    
    # 42: CPR命中 16s -> 裁到2s短促触发音
    print("[42] CPR命中反馈")
    trim_mp3('42 CPR命中反馈.mp3', 2)
    print()
    
    # 46: 群众喧哗 30s -> 裁到15s循环段
    print("[46] 群众喧哗")
    trim_mp3('46 群众喧哗.mp3', 15)
    print()
    
    # 最终结果
    print("\n=== 最终文件大小 ===")
    total = 0
    for f in sorted(os.listdir(AUDIO_DIR)):
        if f.endswith('.mp3'):
            size = os.path.getsize(os.path.join(AUDIO_DIR, f))
            total += size
            print(f"  {f}: {size/1024:.1f}KB")
    print(f"  总计: {total/1024:.1f}KB (原始5918KB)")

if __name__ == '__main__':
    main()