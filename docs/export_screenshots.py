import win32com.client as win32
import os

ppt = win32.Dispatch('PowerPoint.Application')
pres_path = os.path.abspath(r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\docs\thuyet trinh.pptx')
pres = ppt.Presentations.Open(pres_path, False, False, False)
out_dir = os.path.abspath(r'Z:\Tailieu\DoAnCSNganh\tdmu-congdoan-web\docs\slide_screenshots')
os.makedirs(out_dir, exist_ok=True)

for i in range(1, pres.Slides.Count + 1):
    slide = pres.Slides(i)
    slide.Export(os.path.join(out_dir, f'slide_{i}.png'), 'PNG', 1920, 1080)

pres.Close()
ppt.Quit()
print("All slides exported successfully!")
