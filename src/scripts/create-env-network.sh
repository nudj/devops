#!/bin/bash

function commonHelpMessage() {
  echo "Usage: $0 [-f stack-file][-h]" >&2
  echo "  stack-file : The CloudFormation template file" >&2
  echo "  stack-name : The CloudFormation VPC stack name" >&2
  echo "  environment : The environment to create" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":f:s:e:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      f)
        echo "CloudFormation template $OPTARG";CF_TEMPLATE="$OPTARG"
        ;;
      s)
        echo "CloudFormation stack name $OPTARG";STACK_NAME="$OPTARG"
        ;;
      e)
        echo "Environment name $OPTARG";ENVIRONMENT="$OPTARG"
        ;;
      \?)
        echo "Invalid Option -$OPTARG" >&2
        commonHelpMessage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument" >&2
        exit 1
        ;;
      [?])
        commonHelpMessage
        exit 1
        ;;

    esac
  done

  if [ "$CF_TEMPLATE" == "" ]; then
    echo "CloudFormation template parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$STACK_NAME" = "" ]; then
    echo "CloudFormation stack name parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

  if [ "$ENVIRONMNET" = "0" ]; then
    echo "Environment parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi
}

parseCommonArguments "$@"

template=$(cat $CF_TEMPLATE)

aws cloudformation describe-stacks --stack-name $STACK_NAME

# >/dev/null 2>&1

VPC_EXISTS=$?

if [ $VPC_EXISTS -eq 0 ]; then
  echo "Using existing VPC stack, $STACK_NAME"
else
  echo "VPC STack is not ready. Stoppping! Create the $STACK_NAME stack first"
  exit 1
fi

aws cloudformation describe-stacks --stack-name $ENVIRONMENT-networking >/dev/null 2>&1

EXISTS=$?

if [ $EXISTS -eq 0 ]; then
  echo "Stack exists"
  echo "Updating $ENVIONMENT-alb stack from $CF_TEMPLATE template"
  aws cloudformation update-stack --stack-name $ENVIRONMENT-networking --template-body "$template" --parameters ParameterKey=VPCStackName,ParameterValue=$STACK_NAME ParameterKey=EnvironmentType,ParameterValue=$ENVIRONMENT
  UPDATING=$?
  if [ $UPDATING -eq 0 ]; then
    echo "Performing stack update"
  else
    echo "No updates needed. Stack or parameters may not have changed"
    exit 0
  fi
  aws cloudformation wait stack-update-complete --stack-name $ENVIRONMENT-networking

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$ENVIRONMENT-networking failed to update"
    exit 1
  else
    echo "$ENVIRONMENT-networking updated successfully"
  fi
else
  echo "Stack does not exist"
  echo "Creating $ENVIRONMENT-networking stack from $CF_TEMPLATE template"
  aws cloudformation create-stack --stack-name $ENVIRONMENT-networking --template-body "$template" --parameters ParameterKey=VPCStackName,ParameterValue=$STACK_NAME ParameterKey=EnvironmentType,ParameterValue=$ENVIRONMENT

  aws cloudformation wait stack-create-complete --stack-name $ENVIRONMENT-networking

  SUCCESS=$?

  if [ $SUCCESS -eq 255 ]; then
    echo "$ENVIRONMENT-networking failed to create"
    exit 1
  else
    echo "$ENVIRONMENT-networking created successfully"
  fi
fi
