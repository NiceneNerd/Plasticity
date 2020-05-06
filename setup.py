from setuptools import setup
from plasticity_ai import VERSION

with open('docs/README.md', 'r') as readme:
    long_description = readme.read()

setup(
    name='plasticity-ai',
    version=VERSION,
    author='NiceneNerd',
    author_email='macadamiadaze@gmail.com',
    description='An AI program editor for The Legend of Zelda: Breath of the Wild',
    long_description = long_description,
    long_description_content_type = 'text/markdown',
    url = 'https://github.com/NiceneNerd/Plasticity/',
    include_package_data = True,
    packages = ['plasticity_ai'],
    entry_points = {
        'gui_scripts': [
            'plasticity=plasticity_ai.__main__:main'
        ]
    },
    classifiers = [
        'Development Status :: 4 - Beta',
        'License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)',
        'Programming Language :: Python :: 3.7'
    ],
    python_requires = '>=3.7',
    install_requires = [
        'aamp',
        'pywebview'
    ],
    extras_require={
        'CEF':  ["cefpython3>=66.0"]
    }
)